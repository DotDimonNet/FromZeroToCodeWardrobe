using Wardrobe.Domain;
namespace Wardrobe.Application;

public interface ICommand<T> { }
public interface IQuery<T> { }
public interface ICurrentUser { string Id { get; } string DisplayName { get; } }
public interface IUnitOfWork { Task SaveAsync(CancellationToken ct); }
public interface IGarmentRepository
{
    Task<List<Garment>> ListOwnedAsync(string owner, CancellationToken ct);
    Task<Garment?> FindOwnedAsync(Guid id, string owner, CancellationToken ct);
    Task<bool> UsedInOutfitAsync(Guid id, CancellationToken ct);
    void Add(Garment item); void Remove(Garment item);
}
public interface IOutfitRepository
{
    Task<List<Outfit>> ListOwnedAsync(string owner, CancellationToken ct);
    Task<Outfit?> FindOwnedAsync(Guid id, string owner, CancellationToken ct);
    Task<Outfit?> FindSharedAsync(string token, CancellationToken ct);
    void Add(Outfit item); void Remove(Outfit item);
}
public interface IMarketRepository
{
    Task<List<Listing>> BrowseAsync(CancellationToken ct);
    Task<Listing?> FindAsync(Guid id, CancellationToken ct);
    void Add(Listing listing);
    Task<Order> ReserveAsync(Guid listingId, string buyerId, string buyerName, string note, CancellationToken ct);
    Task<List<Order>> OrdersForAsync(string userId, CancellationToken ct);
    Task ResolveAsync(Guid orderId, string userId, string action, CancellationToken ct);
}

public record GarmentDto(Guid Id, string Name, string Category, string Color, string Season, string Style, string Era, string ImageKey, bool IsAvailable, bool IsFavorite)
{
    public static GarmentDto From(Garment g) => new(g.Id, g.Name, g.Category, g.Color, g.Season, g.Style, g.Era, g.ImageKey, g.IsAvailable, g.IsFavorite);
}
public record GarmentInput(string Name, string Category, string Color, string Season, string Style, string Era, string ImageKey, bool IsAvailable = true, bool IsFavorite = false);
public record WardrobeFilter(string? Search = null, string? Category = null, string? Color = null, string? Season = null, string? Style = null, string? Era = null, string? Sort = null, bool? Available = null, bool Favorites = false);
public record GetWardrobe(WardrobeFilter Filter) : IQuery<GarmentDto[]>;
public record AddGarment(GarmentInput Input) : ICommand<GarmentDto>;
public record EditGarment(Guid Id, GarmentInput Input) : ICommand<GarmentDto>;
public record DeleteGarment(Guid Id) : ICommand<bool>;
public record GetSuggestions(OutfitPreferences Preferences) : IQuery<SuggestionDto[]>;
public record SuggestionDto(GarmentDto[] Items, int Score, string[] Reasons);
public record OutfitDto(Guid Id, string Name, string Season, string Style, string Palette, string? ShareToken, GarmentDto[] Items, DateTime CreatedAtUtc)
{ public static OutfitDto From(Outfit o) => new(o.Id, o.Name, o.Season, o.Style, o.Palette, o.ShareToken, o.Items.Select(i => GarmentDto.From(i.Garment)).ToArray(), o.CreatedAtUtc); }
public record SaveOutfit(string Name, Guid[] GarmentIds, OutfitPreferences Preferences) : ICommand<OutfitDto>;
public record SetOutfitSharing(Guid Id, bool Enabled) : ICommand<OutfitDto>;
public record ListingInput(string Title, string Description, string Category, string ImageKey, string Size, string Condition, string Mode, int PriceCents, string City);
public record ListingDto(Guid Id, string SellerName, string Title, string Description, string Category, string ImageKey, string Size, string Condition, string Mode, int PriceCents, string City, bool Available, bool IsMine)
{ public static ListingDto From(Listing l, string owner) => new(l.Id, l.SellerName, l.Title, l.Description, l.Category, l.ImageKey, l.Size, l.Condition, l.Mode, l.PriceCents, l.City, l.Available, l.SellerId == owner); }
public record AddListing(ListingInput Input) : ICommand<ListingDto>;
public record ReserveListing(Guid Id, string Note) : ICommand<OrderDto>;
public record OrderDto(Guid Id, ListingDto Listing, string BuyerName, string Note, string Status, int TotalCents, bool IsSeller, DateTime CreatedAtUtc)
{ public static OrderDto From(Order o, string owner) => new(o.Id, ListingDto.From(o.Listing, owner), o.BuyerName, o.Note, o.Status, o.TotalCents, o.Listing.SellerId == owner, o.CreatedAtUtc); }
