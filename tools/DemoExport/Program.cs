using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Wardrobe.Tests;
using Microsoft.AspNetCore.Hosting;

// Export real API responses for a static, explicitly labeled visual walkthrough.
// This is not a substitute backend and is never included in the application publish.
using var parent=new TestApp();using var app=parent.WithWebHostBuilder(b=>b.UseContentRoot(Path.GetFullPath("src/Wardrobe.Api")));using var buyer=app.CreateClient();using var seller=app.CreateClient();
async Task<JsonNode?> Get(HttpClient c,string path)=>await c.GetFromJsonAsync<JsonNode>("/api/"+path);
async Task<JsonNode?> Post(HttpClient c,string path,object body)
{
    var csrf=(await Get(c,"csrf"))!["token"]!.GetValue<string>();
    using var request=new HttpRequestMessage(HttpMethod.Post,"/api/"+path){Content=JsonContent.Create(body)};
    request.Headers.Add("X-CSRF-TOKEN",csrf);var r=await c.SendAsync(request);r.EnsureSuccessStatusCode();
    return r.StatusCode==System.Net.HttpStatusCode.NoContent?null:await r.Content.ReadFromJsonAsync<JsonNode>();
}
await Post(buyer,"auth/demo",new{});await Post(seller,"auth/demo?seller=true",new{});
var preferences=new{season="All",style="Any",era="Any",palette="Neutral",trendId="essentials"};
var suggestions=(await Post(buyer,"outfits/generate",preferences))!.AsArray();
await Post(buyer,"outfits",new{name="The everyday edit",garmentIds=suggestions[0]!["items"]!.AsArray().Select(x=>x!["id"]!.GetValue<string>()).ToArray(),preferences});
var market=await Get(buyer,"market");var listing=market!.AsArray().First(x=>x!["mode"]!.GetValue<string>()=="Sell")!;
var order=await Post(buyer,$"market/{listing["id"]!.GetValue<string>()}/reserve",new{note="Could we meet at the central library on Saturday at 12:00?"});
var requested=await Get(buyer,"market/orders");
await Post(seller,$"market/orders/{order!["id"]!.GetValue<string>()}/action",new{action="Accept"});
var result=new JsonObject{
    ["config"]=await Get(buyer,"config"),["session"]=await Get(buyer,"auth/me"),
    ["garments"]=await Get(buyer,"garments"),["outfits"]=await Get(buyer,"outfits"),
    ["market"]=market,["requested"]=requested,["orders"]=await Get(buyer,"market/orders"),["suggestions"]=suggestions
};
var output=args.FirstOrDefault()??"artifacts/demo-data.json";Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(output))!);
await File.WriteAllTextAsync(output,result.ToJsonString(new JsonSerializerOptions{WriteIndented=true}));
Console.WriteLine($"Exported API-validated demo data to {output}");
