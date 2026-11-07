using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Wardrobe.Application;
using Wardrobe.Domain;
namespace Wardrobe.Infrastructure;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
    public string City { get; set; } = "";
}
public class WardrobeDb(DbContextOptions<WardrobeDb> options) : IdentityDbContext<AppUser>(options), IUnitOfWork
{
    public DbSet<Garment> Garments => Set<Garment>();
    public DbSet<Outfit> Outfits => Set<Outfit>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Order> Orders => Set<Order>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Garment>().HasIndex(x => x.OwnerId);
        b.Entity<Outfit>().HasIndex(x => x.OwnerId);
        b.Entity<Outfit>().HasIndex(x => x.ShareToken).IsUnique();
        b.Entity<OutfitItem>().HasKey(x => new { x.OutfitId, x.GarmentId });
        b.Entity<OutfitItem>().HasOne(x => x.Garment).WithMany().HasForeignKey(x => x.GarmentId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Outfit>().HasMany(x => x.Items).WithOne().HasForeignKey(x => x.OutfitId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Order>().HasOne(x => x.Listing).WithMany().HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Order>().HasIndex(x => x.BuyerId);
        b.Entity<Listing>().HasIndex(x => x.SellerId);
        b.Entity<Garment>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Outfit>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Listing>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Order>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
    }
    public async Task SaveAsync(CancellationToken ct) => await SaveChangesAsync(ct);
}
public class GarmentRepository(WardrobeDb db) : IGarmentRepository
{
    public Task<List<Garment>> ListOwnedAsync(string owner, CancellationToken ct) => db.Garments.Where(g => g.OwnerId == owner).ToListAsync(ct);
    public Task<Garment?> FindOwnedAsync(Guid id, string owner, CancellationToken ct) => db.Garments.SingleOrDefaultAsync(g => g.Id == id && g.OwnerId == owner, ct);
    public Task<bool> UsedInOutfitAsync(Guid id, CancellationToken ct) => db.Set<OutfitItem>().AnyAsync(i => i.GarmentId == id, ct);
    public void Add(Garment item) => db.Garments.Add(item);
    public void Remove(Garment item) => db.Garments.Remove(item);
}
public class OutfitRepository(WardrobeDb db) : IOutfitRepository
{
    private IQueryable<Outfit> Full => db.Outfits.Include(x => x.Items).ThenInclude(x => x.Garment);
    public Task<List<Outfit>> ListOwnedAsync(string owner, CancellationToken ct) => Full.Where(x => x.OwnerId == owner).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
    public Task<Outfit?> FindOwnedAsync(Guid id, string owner, CancellationToken ct) => Full.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
    public Task<Outfit?> FindSharedAsync(string token, CancellationToken ct) => Full.AsNoTracking().SingleOrDefaultAsync(x => x.ShareToken == token, ct);
    public void Add(Outfit item) => db.Outfits.Add(item);
    public void Remove(Outfit item) => db.Outfits.Remove(item);
}
public class MarketRepository(WardrobeDb db) : IMarketRepository
{
    public Task<List<Listing>> BrowseAsync(CancellationToken ct) => db.Listings.OrderByDescending(x => x.CreatedAtUtc).Take(500).ToListAsync(ct);
    public Task<Listing?> FindAsync(Guid id, CancellationToken ct) => db.Listings.SingleOrDefaultAsync(x => x.Id == id, ct);
    public void Add(Listing listing) => db.Listings.Add(listing);
    public Task<List<Order>> OrdersForAsync(string userId, CancellationToken ct) => db.Orders.Include(x => x.Listing).Where(x => x.BuyerId == userId || x.Listing.SellerId == userId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
    public async Task<Order> ReserveAsync(Guid listingId, string buyerId, string buyerName, string note, CancellationToken ct)
    {
        // One database transaction and a conditional UPDATE: two buyers cannot reserve the same piece.
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var listing = await db.Listings.SingleOrDefaultAsync(x => x.Id == listingId, ct) ?? throw new DomainException("Listing not found.", 404);
        if (listing.SellerId == buyerId) throw new DomainException("You cannot reserve your own listing.");
        if (await db.Listings.Where(x => x.Id == listingId && x.Available).ExecuteUpdateAsync(s => s.SetProperty(x => x.Available, false), ct) != 1)
            throw new DomainException("Someone has already reserved this piece.", 409);
        listing.Available = false;
        var order = new Order { Listing = listing, ListingId = listing.Id, BuyerId = buyerId, BuyerName = buyerName, Note = note, TotalCents = listing.PriceCents };
        db.Orders.Add(order); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct); return order;
    }
    public async Task ResolveAsync(Guid orderId, string userId, string action, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await db.Orders.Include(x => x.Listing).SingleOrDefaultAsync(x => x.Id == orderId && (x.BuyerId == userId || x.Listing.SellerId == userId), ct)
            ?? throw new DomainException("Reservation not found.", 404);
        var seller = order.Listing.SellerId == userId;
        var next = action switch
        {
            "Accept" when seller && order.Status == "Requested" => "Accepted",
            "Decline" when seller && order.Status == "Requested" => "Declined",
            "Complete" when seller && order.Status == "Accepted" => "Completed",
            "Cancel" when !seller && order.Status is "Requested" or "Accepted" => "Cancelled",
            _ => throw new DomainException("This action is not available for this reservation.", 409)
        };
        // Conditional transition also protects against concurrent accept/cancel requests.
        if (await db.Orders.Where(x => x.Id == order.Id && x.Status == order.Status).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, next), ct) != 1)
            throw new DomainException("The reservation changed. Refresh and try again.", 409);
        if (next is "Declined" or "Cancelled" || (next == "Completed" && order.Listing.Mode == "Lend"))
            await db.Listings.Where(x => x.Id == order.ListingId).ExecuteUpdateAsync(s => s.SetProperty(x => x.Available, true), ct);
        await tx.CommitAsync(ct);
    }
}
