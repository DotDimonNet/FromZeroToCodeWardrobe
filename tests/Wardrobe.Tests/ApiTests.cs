using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Wardrobe.Application;
using Wardrobe.Domain;
using Wardrobe.Infrastructure;
namespace Wardrobe.Tests;

public sealed class TestApp:WebApplicationFactory<Program>
{
    private readonly string database=Path.Combine(Path.GetTempPath(),$"thread-tests-{Guid.NewGuid()}.db");
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_,c)=>c.AddInMemoryCollection(new Dictionary<string,string?>{
            ["ConnectionStrings:Wardrobe"]=$"Data Source={database};Default Timeout=30",["Demo:Enabled"]="true",
            ["Smtp:Host"]="",["Authentication:Google:ClientId"]="",["Authentication:Facebook:ClientId"]=""
        }));
    }
    protected override void Dispose(bool disposing){base.Dispose(disposing);if(File.Exists(database))File.Delete(database);}
}
public class ApiTests:IDisposable
{
    private readonly TestApp app=new();
    public void Dispose()=>app.Dispose();
    private HttpClient Client()=>app.CreateClient(new WebApplicationFactoryClientOptions{AllowAutoRedirect=false});
    private static async Task<HttpResponseMessage> Send(HttpClient c,string path,object? body=null,HttpMethod? method=null)
    {
        var token=(await c.GetFromJsonAsync<JsonObject>("/api/csrf"))!["token"]!.GetValue<string>();
        var message=new HttpRequestMessage(method??HttpMethod.Post,path);message.Headers.Add("X-CSRF-TOKEN",token);
        if(body is not null)message.Content=JsonContent.Create(body);return await c.SendAsync(message);
    }
    private static async Task Login(HttpClient c,bool seller=false)=>(await Send(c,$"/api/auth/demo?seller={seller}")).EnsureSuccessStatusCode();
    [Fact] public async Task PrivateDataRequiresAuthenticationAndCommandsRequireCsrf()
    {
        using var c=Client();Assert.Equal(HttpStatusCode.Unauthorized,(await c.GetAsync("/api/garments")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PostAsJsonAsync("/api/auth/demo",new{})).StatusCode);
        await Login(c);Assert.NotEmpty((await c.GetFromJsonAsync<GarmentDto[]>("/api/garments"))!);
    }
    [Fact] public async Task FiltersCombineAndDataPersistsAcrossRequests()
    {
        using var c=Client();await Login(c);
        var input=new GarmentInput("Cobalt test tee","Top","Blue","Summer","Casual","Timeless","white-tee");
        var response=await Send(c,"/api/garments",input);Assert.Equal(HttpStatusCode.Created,response.StatusCode);
        var items=(await c.GetFromJsonAsync<GarmentDto[]>("/api/garments?search=Cobalt&color=Blue&season=Summer&category=Top"))!;
        Assert.Equal("Cobalt test tee",Assert.Single(items).Name);
    }
    [Fact] public async Task OwnershipChecksPreventReadingEditingDeletingAndSavingOtherUsersPieces()
    {
        using var alex=Client();using var maya=Client();await Login(alex);await Login(maya,true);
        var garments=(await alex.GetFromJsonAsync<GarmentDto[]>("/api/garments"))!;
        Assert.Empty((await maya.GetFromJsonAsync<GarmentDto[]>("/api/garments"))!);
        Assert.Equal(HttpStatusCode.NotFound,(await Send(maya,$"/api/garments/{garments[0].Id}",garments[0],HttpMethod.Put)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,(await Send(maya,$"/api/garments/{garments[0].Id}",method:HttpMethod.Delete)).StatusCode);
        var ids=new[]{"Top","Bottom","Shoes"}.Select(cat=>garments.First(g=>g.Category==cat).Id).ToArray();
        Assert.Equal(HttpStatusCode.BadRequest,(await Send(maya,"/api/outfits",new SaveOutfit("Stolen outfit",ids,new()))).StatusCode);
    }
    [Fact] public async Task SharingIsExplicitAnonymousAndRevocable()
    {
        using var c=Client();using var anonymous=Client();await Login(c);
        var outfit=(await c.GetFromJsonAsync<OutfitDto[]>("/api/outfits"))!.First();Assert.Null(outfit.ShareToken);
        var shared=await (await Send(c,$"/api/outfits/{outfit.Id}/sharing",new{enabled=true},HttpMethod.Put)).Content.ReadFromJsonAsync<OutfitDto>();
        Assert.Equal(48,shared!.ShareToken!.Length);var response=await anonymous.GetAsync($"/api/outfits/shared/{shared.ShareToken}");response.EnsureSuccessStatusCode();
        Assert.DoesNotContain("example.test",await response.Content.ReadAsStringAsync());
        await Send(c,$"/api/outfits/{outfit.Id}/sharing",new{enabled=false},HttpMethod.Put);
        Assert.Equal(HttpStatusCode.NotFound,(await anonymous.GetAsync($"/api/outfits/shared/{shared.ShareToken}")).StatusCode);
    }
    [Fact] public async Task ReservationCannotBeDuplicatedAndSellerControlsFulfillment()
    {
        using var buyer=Client();using var seller=Client();await Login(buyer);await Login(seller,true);
        var listing=(await buyer.GetFromJsonAsync<ListingDto[]>("/api/market"))!.First(x=>x.Mode=="Sell");
        var reserved=await Send(buyer,$"/api/market/{listing.Id}/reserve",new{note="Library square, Saturday 12:00."});Assert.Equal(HttpStatusCode.Created,reserved.StatusCode);
        var order=(await reserved.Content.ReadFromJsonAsync<OrderDto>())!;Assert.Equal(listing.PriceCents,order.TotalCents);
        Assert.Equal(HttpStatusCode.Conflict,(await Send(buyer,$"/api/market/{listing.Id}/reserve",new{note="Again"})).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict,(await Send(buyer,$"/api/market/orders/{order.Id}/action",new{action="Accept"})).StatusCode);
        (await Send(seller,$"/api/market/orders/{order.Id}/action",new{action="Accept"})).EnsureSuccessStatusCode();
        (await Send(seller,$"/api/market/orders/{order.Id}/action",new{action="Complete"})).EnsureSuccessStatusCode();
        Assert.Equal("Completed",Assert.Single((await buyer.GetFromJsonAsync<OrderDto[]>("/api/market/orders"))!).Status);
        Assert.Equal(HttpStatusCode.Conflict,(await Send(buyer,$"/api/market/orders/{order.Id}/action",new{action="Cancel"})).StatusCode);
    }
    [Fact] public async Task ConcurrentReservationRequestsHaveExactlyOneWinner()
    {
        using var c=Client();await Login(c);var listing=(await c.GetFromJsonAsync<ListingDto[]>("/api/market"))!.First();
        // Separate clients and pre-issued CSRF tokens exercise separate DB contexts/connections.
        using var second=Client();await Login(second);
        var responses=await Task.WhenAll(Send(c,$"/api/market/{listing.Id}/reserve",new{note="First"}),Send(second,$"/api/market/{listing.Id}/reserve",new{note="Second"}));
        Assert.Single(responses,r=>r.StatusCode==HttpStatusCode.Created);Assert.Single(responses,r=>r.StatusCode==HttpStatusCode.Conflict);
    }
    [Fact] public async Task CancellationReleasesInventoryAndOwnListingCannotBeReserved()
    {
        using var buyer=Client();using var seller=Client();await Login(buyer);await Login(seller,true);
        var listing=(await buyer.GetFromJsonAsync<ListingDto[]>("/api/market"))!.First();
        Assert.Equal(HttpStatusCode.BadRequest,(await Send(seller,$"/api/market/{listing.Id}/reserve",new{note="Mine"})).StatusCode);
        var order=(await (await Send(buyer,$"/api/market/{listing.Id}/reserve",new{note=""})).Content.ReadFromJsonAsync<OrderDto>())!;
        (await Send(buyer,$"/api/market/orders/{order.Id}/action",new{action="Cancel"})).EnsureSuccessStatusCode();
        Assert.True((await buyer.GetFromJsonAsync<ListingDto[]>("/api/market"))!.Single(x=>x.Id==listing.Id).Available);
    }
    [Fact] public async Task RegistrationActivationRecoveryAndLogoutWorkTogether()
    {
        using var c=Client();const string email="learner@example.test",password="Learn-Thread-2026!";
        var registered=await Send(c,"/api/auth/register",new{email,password,displayName="Learner"});registered.EnsureSuccessStatusCode();
        var activation=(await registered.Content.ReadFromJsonAsync<JsonObject>())!["developmentLink"]!.GetValue<string>();
        Assert.Equal(HttpStatusCode.Forbidden,(await Send(c,"/api/auth/login",new{email,password})).StatusCode);
        var parts=Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(new Uri("http://localhost"+activation).Query);
        (await Send(c,"/api/auth/activate",new{userId=parts["userId"].ToString(),token=parts["token"].ToString()})).EnsureSuccessStatusCode();
        (await Send(c,"/api/auth/login",new{email,password})).EnsureSuccessStatusCode();
        (await Send(c,"/api/auth/logout")).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized,(await c.GetAsync("/api/garments")).StatusCode);
        var recovery=await Send(c,"/api/auth/forgot",new{email});var link=(await recovery.Content.ReadFromJsonAsync<JsonObject>())!["developmentLink"]!.GetValue<string>();
        parts=Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(new Uri("http://localhost"+link).Query);
        const string newPassword="New-Thread-2026!";
        (await Send(c,"/api/auth/reset",new{userId=parts["userId"].ToString(),token=parts["token"].ToString(),password=newPassword})).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized,(await Send(c,"/api/auth/login",new{email,password})).StatusCode);
        (await Send(c,"/api/auth/login",new{email,password=newPassword})).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.BadRequest,(await Send(c,"/api/auth/reset",new{userId=parts["userId"].ToString(),token=parts["token"].ToString(),password="Another-2026!"})).StatusCode);
    }
    [Fact] public async Task UnconfiguredExternalProvidersAreNotAdvertised()
    {using var c=Client();var config=(await c.GetFromJsonAsync<JsonObject>("/api/config"))!;Assert.Empty(config["providers"]!.AsArray());Assert.Equal(HttpStatusCode.NotFound,(await c.GetAsync("/api/auth/external/Google")).StatusCode);}
}
