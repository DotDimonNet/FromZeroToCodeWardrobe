using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Wardrobe.Domain;
namespace Wardrobe.Infrastructure;

public static class DemoSeed
{
    public const string Email = "alex@example.test";
    public const string SellerEmail = "maya@example.test";
    public const string Password = "Thread-Demo-2026!";
    public static async Task Run(WardrobeDb db, UserManager<AppUser> users)
    {
        async Task<AppUser> User(string email, string name)
        {
            var u = await users.FindByEmailAsync(email); if (u is not null) return u;
            u = new AppUser { UserName = email, Email = email, DisplayName = name, City = "Vinnytsia", EmailConfirmed = true };
            var result = await users.CreateAsync(u, Password);
            if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
            return u;
        }
        var alex = await User(Email, "Alex Morgan"); var maya = await User(SellerEmail, "Maya Chen");
        if (await db.Garments.AnyAsync(g => g.OwnerId == alex.Id)) return;
        var specs = new (string Name, string Category, string Color, string Season, string Style, string Era, string Image)[]{
            ("The everyday white tee","Top","White","All","Minimal","Timeless","white-tee"),
            ("Straight-leg vintage denim","Bottom","Blue","All","Casual","90s","jeans"),
            ("Crimson court sneakers","Shoes","Red","All","Streetwear","Contemporary","sneakers"),
            ("The classic black tee","Top","Black","All","Minimal","Timeless","black-tee"),
            ("Soft gray essential","Top","Gray","All","Casual","Timeless","gray-tee"),
            ("Weekend denim shirt","Top","Blue","Spring","Casual","90s","denim-shirt"),
            ("Deep indigo denim","Bottom","Navy","All","Minimal","Timeless","dark-jeans"),
            ("Breton stripe knit","Top","Cream","Autumn","Classic","Timeless","striped-knit"),
            ("Retro blue trainers","Shoes","Blue","All","Casual","90s","retro-shoes"),
            ("Heritage high-tops","Shoes","White","All","Minimal","Contemporary","high-tops"),
            ("Navy wool peacoat","Outerwear","Navy","Winter","Classic","Timeless","coat")};
        var pieces = specs.Select((s, i) => new Garment { OwnerId = alex.Id, Name = s.Name, Category = s.Category, Color = s.Color, Season = s.Season, Style = s.Style, Era = s.Era, ImageKey = s.Image, IsFavorite = i is 0 or 1 or 8, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-i) }).ToArray();
        db.Garments.AddRange(pieces);
        var look = new Outfit { OwnerId = alex.Id, Name = "A slower Sunday", Season = "All", Style = "Any", Palette = "Any" };
        look.Items = new[] { 0, 1, 8 }.Select(i => new OutfitItem { OutfitId = look.Id, GarmentId = pieces[i].Id, Garment = pieces[i] }).ToList(); db.Outfits.Add(look);
        var listings = new[]{
            new Listing{Title="A little more denim",Description="A relaxed denim shirt, ready for its next chapter. Freshly washed. Local pickup by arrangement.",Category="Top",ImageKey="denim-shirt",Mode="Sell",PriceCents=2400,Size="M"},
            new Listing{Title="Borrow my weekend trainers",Description="Retro trainers for a weekend look. Please return clean within seven days; arrange details after acceptance.",Category="Shoes",ImageKey="retro-shoes",Mode="Lend",PriceCents=0,Size="EU 40"},
            new Listing{Title="A classic, passed on",Description="A well-loved white tee with plenty of life left. Free to a new wardrobe. Local collection.",Category="Top",ImageKey="white-tee",Mode="Giveaway",PriceCents=0,Size="L"},
            new Listing{Title="Your next winter layer",Description="A timeless navy peacoat in very good condition. See the photo and arrange a fitting at pickup.",Category="Outerwear",ImageKey="coat",Mode="Sell",PriceCents=4800,Size="M"}
        };
        foreach (var l in listings) { l.SellerId = maya.Id; l.SellerName = maya.DisplayName; db.Listings.Add(l); }
        await db.SaveChangesAsync();
    }
}
