using Wardrobe.Domain;
namespace Wardrobe.Tests;
public class OutfitEngineTests
{
    private readonly OutfitEngine engine=new();
    private static Garment Piece(string category,string color="White",string season="All",bool available=true)=>new(){Category=category,Color=color,Season=season,Style="Casual",Era="Timeless",IsAvailable=available};
    [Fact] public void ProducesThreeDifferentCategoriesAndExcludesUnavailable()
    {
        var top=Piece("Top");var bottom=Piece("Bottom","Blue");var shoes=Piece("Shoes");var absent=Piece("Top",available:false);
        var result=Assert.Single(engine.Generate([top,bottom,shoes,absent],new()));
        Assert.Equal(3,result.Items.Select(g=>g.Category).Distinct().Count());Assert.DoesNotContain(absent,result.Items);
    }
    [Fact] public void NeverFallsBackToAnIncompatibleSeason()
    {Assert.Empty(engine.Generate([Piece("Top",season:"Winter"),Piece("Bottom"),Piece("Shoes")],new(Season:"Summer")));}
    [Fact] public void NeutralPaletteRejectsChromaticOutfits()
    {Assert.Empty(engine.Generate([Piece("Top"),Piece("Bottom","Blue"),Piece("Shoes")],new(Palette:"Neutral")));}
    [Theory]
    [InlineData("Purple")][InlineData("")][InlineData("'; DROP TABLE Garments;")]
    public void RejectsUnsupportedPreferences(string palette)
    {Assert.Throws<DomainException>(()=>engine.Generate([],new(Palette:palette)));}
    [Fact] public void SavedSelectionMustStillBeAvailable()
    {Assert.Throws<DomainException>(()=>engine.ValidateSelection([Piece("Top"),Piece("Bottom"),Piece("Shoes",available:false)],new()));}
    [Fact] public void LimitsCombinatorialOutputToThreeAndIsDeterministic()
    {
        var items=Enumerable.Range(0,5).SelectMany(_=>new[]{Piece("Top"),Piece("Bottom"),Piece("Shoes")}).ToArray();
        var first=engine.Generate(items,new());var second=engine.Generate(items,new());
        Assert.Equal(3,first.Length);Assert.Equal(first.SelectMany(s=>s.Items).Select(g=>g.Id),second.SelectMany(s=>s.Items).Select(g=>g.Id));
    }
}
