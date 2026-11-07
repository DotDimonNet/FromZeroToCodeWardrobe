namespace Wardrobe.Domain;

public class Garment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "Top";
    public string Color { get; set; } = "Cream";
    public string Season { get; set; } = "All";
    public string Style { get; set; } = "Casual";
    public string Era { get; set; } = "Timeless";
    public string ImageKey { get; set; } = "white-tee";
    public bool IsAvailable { get; set; } = true;
    public bool IsFavorite { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class Outfit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Season { get; set; } = "All";
    public string Style { get; set; } = "Any";
    public string Era { get; set; } = "Any";
    public string Palette { get; set; } = "Any";
    public string? TrendId { get; set; }
    public string? ShareToken { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public List<OutfitItem> Items { get; set; } = [];
}
public class OutfitItem
{
    public Guid OutfitId { get; set; }
    public Guid GarmentId { get; set; }
    public Garment Garment { get; set; } = null!;
}
public class Listing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SellerId { get; set; } = "";
    public string SellerName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "Top";
    public string ImageKey { get; set; } = "white-tee";
    public string Size { get; set; } = "M";
    public string Condition { get; set; } = "Very good";
    public string Mode { get; set; } = "Sell";
    public int PriceCents { get; set; }
    public string City { get; set; } = "Vinnytsia";
    public bool Available { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
    public string BuyerId { get; set; } = "";
    public string BuyerName { get; set; } = "";
    public string Note { get; set; } = "";
    public string Status { get; set; } = "Requested";
    public int TotalCents { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class DomainException(string message, int status = 400) : Exception(message)
{ public int Status { get; } = status; }

public record TrendEdit(string Id, string Title, string Description, string Style, string[] Colors);
public static class Vocabulary
{
    public static readonly string[] Categories = ["Top", "Bottom", "Shoes", "Outerwear", "Accessory"];
    public static readonly string[] Seasons = ["All", "Spring", "Summer", "Autumn", "Winter"];
    public static readonly string[] Styles = ["Casual", "Minimal", "Classic", "Streetwear", "Sport"];
    public static readonly string[] Eras = ["Timeless", "Contemporary", "90s", "Vintage"];
    public static readonly string[] Palettes = ["Any", "Neutral", "Monochrome", "Complementary"];
    public static readonly Dictionary<string, string> Colors = new()
    {
        ["White"] = "#f5f4ef",
        ["Cream"] = "#e7d9bf",
        ["Black"] = "#252525",
        ["Gray"] = "#90908b",
        ["Navy"] = "#24374b",
        ["Blue"] = "#587e9e",
        ["Green"] = "#718571",
        ["Brown"] = "#9b7358",
        ["Red"] = "#b55c4c",
        ["Pink"] = "#d4a3aa",
        ["Yellow"] = "#d6b467"
    };
    public static readonly string[] Images = ["white-tee", "black-tee", "gray-tee", "denim-shirt", "jeans", "dark-jeans", "striped-knit", "sneakers", "retro-shoes", "high-tops", "coat"];
    public static readonly TrendEdit[] Trends = [
        new("essentials", "Quiet essentials", "Simple shapes, soft neutrals, more ways to wear.", "Minimal", ["Cream","White","Black","Gray"]),
        new("denim", "Denim days", "An editor-curated nod to the relaxed 90s wardrobe.", "Casual", ["Blue","Navy","White"]),
        new("street", "Sport meets street", "Retro trainers and easy everyday layers.", "Streetwear", ["Green","Blue","Gray"])
    ];
    public static void Check(string value, IEnumerable<string> allowed, string field)
    { if (!allowed.Contains(value)) throw new DomainException($"Choose a supported {field}."); }
    public static string Text(string? value, int max, string field, bool required = true)
    {
        var clean = value?.Trim() ?? "";
        if ((required && clean.Length == 0) || clean.Length > max)
            throw new DomainException($"{field} must be {(required ? "1" : "0")}–{max} characters.");
        return clean;
    }
}
