using System.Security.Cryptography;
using Wardrobe.Domain;
namespace Wardrobe.Application;

public class WardrobeQueryHandler(IGarmentRepository repo, ICurrentUser user)
{
    public async Task<GarmentDto[]> Handle(GetWardrobe query, CancellationToken ct)
    {
        var f = query.Filter;
        IEnumerable<Garment> items = await repo.ListOwnedAsync(user.Id, ct);
        if (!string.IsNullOrWhiteSpace(f.Search)) items = items.Where(g => g.Name.Contains(f.Search.Trim(), StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(f.Category)) items = items.Where(g => g.Category == f.Category);
        if (!string.IsNullOrEmpty(f.Color)) items = items.Where(g => g.Color == f.Color);
        if (!string.IsNullOrEmpty(f.Season)) items = items.Where(g => g.Season == "All" || g.Season == f.Season);
        if (!string.IsNullOrEmpty(f.Style)) items = items.Where(g => g.Style == f.Style);
        if (!string.IsNullOrEmpty(f.Era)) items = items.Where(g => g.Era == "Timeless" || g.Era == f.Era);
        if (f.Available.HasValue) items = items.Where(g => g.IsAvailable == f.Available);
        if (f.Favorites) items = items.Where(g => g.IsFavorite);
        items = f.Sort switch { "name" => items.OrderBy(g => g.Name), "color" => items.OrderBy(g => g.Color), _ => items.OrderByDescending(g => g.CreatedAtUtc) };
        return items.Take(500).Select(GarmentDto.From).ToArray();
    }
}
public class WardrobeCommandHandler(IGarmentRepository repo, IUnitOfWork unit, ICurrentUser user)
{
    private static void Apply(Garment g, GarmentInput x)
    {
        g.Name = Vocabulary.Text(x.Name, 80, "Name");
        Vocabulary.Check(x.Category, Vocabulary.Categories, "category");
        Vocabulary.Check(x.Color, Vocabulary.Colors.Keys, "color");
        Vocabulary.Check(x.Season, Vocabulary.Seasons, "season");
        Vocabulary.Check(x.Style, Vocabulary.Styles, "style");
        Vocabulary.Check(x.Era, Vocabulary.Eras, "era");
        Vocabulary.Check(x.ImageKey, Vocabulary.Images, "photo");
        g.Category = x.Category; g.Color = x.Color; g.Season = x.Season; g.Style = x.Style; g.Era = x.Era;
        g.ImageKey = x.ImageKey; g.IsAvailable = x.IsAvailable; g.IsFavorite = x.IsFavorite;
    }
    public async Task<GarmentDto> Handle(AddGarment command, CancellationToken ct)
    {
        if ((await repo.ListOwnedAsync(user.Id, ct)).Count >= 500) throw new DomainException("Your MVP wardrobe can hold up to 500 pieces.");
        var g = new Garment { OwnerId = user.Id }; Apply(g, command.Input); repo.Add(g); await unit.SaveAsync(ct); return GarmentDto.From(g);
    }
    public async Task<GarmentDto> Handle(EditGarment command, CancellationToken ct)
    {
        var g = await repo.FindOwnedAsync(command.Id, user.Id, ct) ?? throw new DomainException("Piece not found.", 404);
        Apply(g, command.Input); await unit.SaveAsync(ct); return GarmentDto.From(g);
    }
    public async Task<bool> Handle(DeleteGarment command, CancellationToken ct)
    {
        var g = await repo.FindOwnedAsync(command.Id, user.Id, ct) ?? throw new DomainException("Piece not found.", 404);
        if (await repo.UsedInOutfitAsync(g.Id, ct)) throw new DomainException("Remove saved outfits using this piece before deleting it.", 409);
        repo.Remove(g); await unit.SaveAsync(ct); return true;
    }
}
public class OutfitQueryHandler(IGarmentRepository garments, IOutfitRepository outfits, ICurrentUser user, OutfitEngine engine)
{
    public async Task<SuggestionDto[]> Handle(GetSuggestions query, CancellationToken ct) =>
        engine.Generate(await garments.ListOwnedAsync(user.Id, ct), query.Preferences)
            .Select(s => new SuggestionDto(s.Items.Select(GarmentDto.From).ToArray(), s.Score, s.Reasons)).ToArray();
    public async Task<OutfitDto[]> List(CancellationToken ct) => (await outfits.ListOwnedAsync(user.Id, ct)).Select(OutfitDto.From).ToArray();
    public async Task<OutfitDto> Shared(string token, CancellationToken ct)
    {
        if (token.Length != 48) throw new DomainException("This shared outfit is no longer available.", 404);
        return OutfitDto.From(await outfits.FindSharedAsync(token, ct) ?? throw new DomainException("This shared outfit is no longer available.", 404));
    }
}
public class OutfitCommandHandler(IGarmentRepository garments, IOutfitRepository outfits, IUnitOfWork unit, ICurrentUser user, OutfitEngine engine)
{
    public async Task<OutfitDto> Handle(SaveOutfit command, CancellationToken ct)
    {
        var name = Vocabulary.Text(command.Name, 80, "Outfit name");
        if (command.GarmentIds is null || command.GarmentIds.Length != 3 || command.GarmentIds.Distinct().Count() != 3) throw new DomainException("Choose three different pieces.");
        var owned = await garments.ListOwnedAsync(user.Id, ct);
        var selected = owned.Where(g => command.GarmentIds.Contains(g.Id)).ToArray();
        engine.ValidateSelection(selected, command.Preferences);
        var p = command.Preferences;
        var outfit = new Outfit { OwnerId = user.Id, Name = name, Season = p.Season, Style = p.Style, Era = p.Era, Palette = p.Palette, TrendId = p.TrendId };
        outfit.Items = selected.Select(g => new OutfitItem { OutfitId = outfit.Id, GarmentId = g.Id, Garment = g }).ToList();
        outfits.Add(outfit); await unit.SaveAsync(ct); return OutfitDto.From(outfit);
    }
    public async Task<OutfitDto> Handle(SetOutfitSharing command, CancellationToken ct)
    {
        var o = await outfits.FindOwnedAsync(command.Id, user.Id, ct) ?? throw new DomainException("Outfit not found.", 404);
        o.ShareToken = command.Enabled ? o.ShareToken ?? Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant() : null;
        await unit.SaveAsync(ct); return OutfitDto.From(o);
    }
    public async Task Delete(Guid id, CancellationToken ct)
    {
        var o = await outfits.FindOwnedAsync(id, user.Id, ct) ?? throw new DomainException("Outfit not found.", 404);
        outfits.Remove(o); await unit.SaveAsync(ct);
    }
}
public class MarketQueryHandler(IMarketRepository repo, ICurrentUser user)
{
    public async Task<ListingDto[]> Browse(CancellationToken ct) => (await repo.BrowseAsync(ct)).Select(l => ListingDto.From(l, user.Id)).ToArray();
    public async Task<OrderDto[]> Orders(CancellationToken ct) => (await repo.OrdersForAsync(user.Id, ct)).Select(o => OrderDto.From(o, user.Id)).ToArray();
}
public class MarketCommandHandler(IMarketRepository repo, IUnitOfWork unit, ICurrentUser user)
{
    public async Task<ListingDto> Handle(AddListing command, CancellationToken ct)
    {
        var x = command.Input;
        Vocabulary.Check(x.Category, Vocabulary.Categories, "category"); Vocabulary.Check(x.ImageKey, Vocabulary.Images, "photo");
        Vocabulary.Check(x.Mode, ["Sell", "Lend", "Giveaway"], "listing type");
        Vocabulary.Check(x.Condition, ["New", "Like new", "Very good", "Good"], "condition");
        if (x.PriceCents < 0 || x.PriceCents > 1000000 || (x.Mode == "Giveaway" && x.PriceCents != 0)) throw new DomainException("Enter a valid price; giveaways must be free.");
        var listing = new Listing { SellerId = user.Id, SellerName = user.DisplayName, Title = Vocabulary.Text(x.Title, 80, "Title"), Description = Vocabulary.Text(x.Description, 800, "Description"), Category = x.Category, ImageKey = x.ImageKey, Size = Vocabulary.Text(x.Size, 15, "Size"), Condition = x.Condition, Mode = x.Mode, PriceCents = x.PriceCents, City = Vocabulary.Text(x.City, 60, "City") };
        repo.Add(listing); await unit.SaveAsync(ct); return ListingDto.From(listing, user.Id);
    }
    public async Task<OrderDto> Handle(ReserveListing command, CancellationToken ct) => OrderDto.From(await repo.ReserveAsync(command.Id, user.Id, user.DisplayName, Vocabulary.Text(command.Note, 500, "Message", false), ct), user.Id);
    public Task Resolve(Guid id, string action, CancellationToken ct)
    { Vocabulary.Check(action, ["Accept", "Decline", "Cancel", "Complete"], "order action"); return repo.ResolveAsync(id, user.Id, action, ct); }
    public async Task Withdraw(Guid id, CancellationToken ct)
    {
        var l = await repo.FindAsync(id, ct) ?? throw new DomainException("Listing not found.", 404);
        if (l.SellerId != user.Id) throw new DomainException("Listing not found.", 404);
        if (!l.Available) throw new DomainException("This listing is already reserved or withdrawn.", 409);
        l.Available = false; await unit.SaveAsync(ct);
    }
}
