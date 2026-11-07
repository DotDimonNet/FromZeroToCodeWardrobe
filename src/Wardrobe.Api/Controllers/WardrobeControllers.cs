using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wardrobe.Application;
using Wardrobe.Domain;
namespace Wardrobe.Api.Controllers;

[ApiController, Authorize, Route("api/garments")]
public class GarmentsController(WardrobeQueryHandler queries, WardrobeCommandHandler commands) : ControllerBase
{
    [HttpGet] public Task<GarmentDto[]> List([FromQuery] WardrobeFilter filter, CancellationToken ct) => queries.Handle(new GetWardrobe(filter), ct);
    [HttpPost] public async Task<IActionResult> Add(GarmentInput input, CancellationToken ct) { var g = await commands.Handle(new AddGarment(input), ct); return Created($"/api/garments/{g.Id}", g); }
    [HttpPut("{id:guid}")] public Task<GarmentDto> Edit(Guid id, GarmentInput input, CancellationToken ct) => commands.Handle(new EditGarment(id, input), ct);
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await commands.Handle(new DeleteGarment(id), ct); return NoContent(); }
}
public record SharingInput(bool Enabled);
[ApiController, Authorize, Route("api/outfits")]
public class OutfitsController(OutfitQueryHandler queries, OutfitCommandHandler commands) : ControllerBase
{
    [HttpGet] public Task<OutfitDto[]> List(CancellationToken ct) => queries.List(ct);
    [HttpPost("generate")] public Task<SuggestionDto[]> Generate(OutfitPreferences preferences, CancellationToken ct) => queries.Handle(new GetSuggestions(preferences), ct);
    [HttpPost] public async Task<IActionResult> Save(SaveOutfit input, CancellationToken ct) { var o = await commands.Handle(input, ct); return Created($"/api/outfits/{o.Id}", o); }
    [HttpPut("{id:guid}/sharing")] public Task<OutfitDto> Share(Guid id, SharingInput input, CancellationToken ct) => commands.Handle(new SetOutfitSharing(id, input.Enabled), ct);
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await commands.Delete(id, ct); return NoContent(); }
    [AllowAnonymous, HttpGet("shared/{token}")] public Task<OutfitDto> Shared(string token, CancellationToken ct) => queries.Shared(token, ct);
}
public record ReservationInput(string Note);
public record OrderActionInput(string Action);
[ApiController, Authorize, Route("api/market")]
public class MarketController(MarketQueryHandler queries, MarketCommandHandler commands) : ControllerBase
{
    [HttpGet] public Task<ListingDto[]> List(CancellationToken ct) => queries.Browse(ct);
    [HttpPost] public async Task<IActionResult> Add(ListingInput input, CancellationToken ct) { var l = await commands.Handle(new AddListing(input), ct); return Created($"/api/market/{l.Id}", l); }
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Withdraw(Guid id, CancellationToken ct) { await commands.Withdraw(id, ct); return NoContent(); }
    [HttpPost("{id:guid}/reserve")] public async Task<IActionResult> Reserve(Guid id, ReservationInput input, CancellationToken ct) { var o = await commands.Handle(new ReserveListing(id, input.Note), ct); return Created($"/api/market/orders/{o.Id}", o); }
    [HttpGet("orders")] public Task<OrderDto[]> Orders(CancellationToken ct) => queries.Orders(ct);
    [HttpPost("orders/{id:guid}/action")] public async Task<IActionResult> Resolve(Guid id, OrderActionInput input, CancellationToken ct) { await commands.Resolve(id, input.Action, ct); return NoContent(); }
}
