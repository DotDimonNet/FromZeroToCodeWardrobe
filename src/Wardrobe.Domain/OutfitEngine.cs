namespace Wardrobe.Domain;

public record OutfitPreferences(string Season = "All", string Style = "Any", string Era = "Any", string Palette = "Any", string? TrendId = null);
public record OutfitSuggestion(Garment[] Items, int Score, string[] Reasons);

/// <summary>Deterministic, explainable selection. No live fashion-feed or AI claim.</summary>
public class OutfitEngine
{
    private static readonly HashSet<string> Neutrals = ["White", "Cream", "Black", "Gray", "Navy", "Brown"];
    private static readonly Dictionary<string, int> Hues = new()
    { ["Red"] = 8, ["Pink"] = 347, ["Yellow"] = 44, ["Green"] = 120, ["Blue"] = 207, ["Navy"] = 210, ["Brown"] = 26, ["Cream"] = 40, ["White"] = 0, ["Black"] = 0, ["Gray"] = 0 };
    public void Validate(OutfitPreferences p)
    {
        Vocabulary.Check(p.Season, Vocabulary.Seasons, "season");
        Vocabulary.Check(p.Style, Vocabulary.Styles.Append("Any"), "style");
        Vocabulary.Check(p.Era, Vocabulary.Eras.Append("Any"), "era");
        Vocabulary.Check(p.Palette, Vocabulary.Palettes, "palette");
        if (p.TrendId is not null && !Vocabulary.Trends.Any(t => t.Id == p.TrendId)) throw new DomainException("Unknown style edit.");
    }
    public bool Eligible(Garment g, OutfitPreferences p) => g.IsAvailable
        && (p.Season == "All" || g.Season == "All" || g.Season == p.Season)
        && (p.Style == "Any" || g.Style == p.Style)
        && (p.Era == "Any" || g.Era == "Timeless" || g.Era == p.Era);

    public bool MatchesPalette(IEnumerable<Garment> items, string palette)
    {
        var colors = items.Select(i => i.Color).Distinct().ToArray();
        if (palette == "Any") return true;
        if (palette == "Neutral") return colors.All(Neutrals.Contains);
        var chromatic = colors.Where(c => !Neutrals.Contains(c)).ToArray();
        if (chromatic.Length < 2) return true;
        for (int i = 0; i < chromatic.Length; i++)
            for (int j = i + 1; j < chromatic.Length; j++)
            {
                var distance = Math.Abs(Hues[chromatic[i]] - Hues[chromatic[j]]);
                distance = Math.Min(distance, 360 - distance);
                if (palette == "Monochrome" && distance > 40) return false;
                if (palette == "Complementary" && distance > 40 && (distance < 150 || distance > 210)) return false;
            }
        return true;
    }
    public OutfitSuggestion[] Generate(IEnumerable<Garment> wardrobe, OutfitPreferences p)
    {
        Validate(p);
        var eligible = wardrobe.Where(g => Eligible(g, p)).OrderBy(g => g.Id).ToArray();
        var edit = Vocabulary.Trends.FirstOrDefault(t => t.Id == p.TrendId);
        var candidates = new List<OutfitSuggestion>();
        foreach (var top in eligible.Where(g => g.Category == "Top").Take(20))
            foreach (var bottom in eligible.Where(g => g.Category == "Bottom").Take(20))
                foreach (var shoes in eligible.Where(g => g.Category == "Shoes").Take(20))
                {
                    Garment[] trio = [top, bottom, shoes];
                    if (!MatchesPalette(trio, p.Palette)) continue;
                    var score = 60 + trio.Count(g => g.IsFavorite) * 3 + (trio.Select(g => g.Style).Distinct().Count() == 1 ? 10 : 0)
                        + (edit is null ? 0 : trio.Count(g => g.Style == edit.Style) * 4 + trio.Count(g => edit.Colors.Contains(g.Color)) * 3);
                    candidates.Add(new(trio, Math.Min(score, 99), [$"Available for {p.Season.ToLowerInvariant()} season", $"{p.Palette} palette rule", edit is null ? "Balanced top, bottom and shoes" : $"Inspired by {edit.Title.ToLowerInvariant()}"]));
                }
        return candidates.OrderByDescending(c => c.Score).Take(3).ToArray();
    }
    public void ValidateSelection(IEnumerable<Garment> garments, OutfitPreferences preferences)
    {
        Validate(preferences);
        var items = garments.ToArray();
        if (items.Length != 3 || items.Select(x => x.Id).Distinct().Count() != 3 || !new[] { "Top", "Bottom", "Shoes" }.All(c => items.Count(g => g.Category == c) == 1))
            throw new DomainException("An outfit needs one top, one bottom and one pair of shoes.");
        if (items.Any(g => !Eligible(g, preferences)) || !MatchesPalette(items, preferences.Palette))
            throw new DomainException("Some pieces no longer match this outfit. Generate it again.", 409);
    }
}
