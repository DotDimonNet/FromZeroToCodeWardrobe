using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Wardrobe.Api;
using Wardrobe.Application;
using Wardrobe.Domain;
using Wardrobe.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var keysPath = builder.Configuration["DataProtection:Path"];
if (!string.IsNullOrWhiteSpace(keysPath))
{ Directory.CreateDirectory(keysPath); builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keysPath)).SetApplicationName("ThreadWardrobe"); }
builder.Services.AddDbContext<WardrobeDb>(o => o.UseSqlite(builder.Configuration.GetConnectionString("Wardrobe") ?? "Data Source=wardrobe.db"));
builder.Services.AddIdentity<AppUser, IdentityRole>(o =>
{
    o.User.RequireUniqueEmail = true; o.SignIn.RequireConfirmedEmail = true;
    o.Password.RequiredLength = 10; o.Password.RequireNonAlphanumeric = true;
    o.Lockout.MaxFailedAccessAttempts = 5; o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddEntityFrameworkStores<WardrobeDb>().AddDefaultTokenProviders().AddClaimsPrincipalFactory<AppClaimsFactory>();
builder.Services.Configure<DataProtectionTokenProviderOptions>(o => o.TokenLifespan = TimeSpan.FromHours(2));
builder.Services.Configure<SecurityStampValidatorOptions>(o => o.ValidationInterval = TimeSpan.Zero);
builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = "Thread.Session"; o.Cookie.HttpOnly = true; o.Cookie.SameSite = SameSiteMode.Lax;
    o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    o.ExpireTimeSpan = TimeSpan.FromHours(8); o.SlidingExpiration = true;
    o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
});
var auth = builder.Services.AddAuthentication();
var providers = new List<string>();
if (!string.IsNullOrWhiteSpace(builder.Configuration["Authentication:Google:ClientId"]) && !string.IsNullOrWhiteSpace(builder.Configuration["Authentication:Google:ClientSecret"]))
{
    providers.Add("Google"); auth.AddGoogle(o =>
    {
        o.ClientId = builder.Configuration["Authentication:Google:ClientId"]!; o.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
        o.SignInScheme = IdentityConstants.ExternalScheme;
        o.ClaimActions.MapJsonKey("email_verified", "verified_email");
        o.Events.OnRemoteFailure = c => { c.Response.Redirect("/?authError=Google%20sign-in%20was%20cancelled%20or%20failed."); c.HandleResponse(); return Task.CompletedTask; };
    });
}
if (!string.IsNullOrWhiteSpace(builder.Configuration["Authentication:Facebook:ClientId"]) && !string.IsNullOrWhiteSpace(builder.Configuration["Authentication:Facebook:ClientSecret"]))
{
    providers.Add("Facebook"); auth.AddFacebook(o =>
    {
        o.AppId = builder.Configuration["Authentication:Facebook:ClientId"]!; o.AppSecret = builder.Configuration["Authentication:Facebook:ClientSecret"]!; o.SignInScheme = IdentityConstants.ExternalScheme;
        o.Events.OnRemoteFailure = c => { c.Response.Redirect("/?authError=Facebook%20sign-in%20was%20cancelled%20or%20failed."); c.HandleResponse(); return Task.CompletedTask; };
    });
}
builder.Services.AddHttpContextAccessor(); builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<IAccountMailer, AccountMailer>();
builder.Services.AddScoped<IUnitOfWork>(s => s.GetRequiredService<WardrobeDb>());
builder.Services.AddScoped<IGarmentRepository, GarmentRepository>(); builder.Services.AddScoped<IOutfitRepository, OutfitRepository>(); builder.Services.AddScoped<IMarketRepository, MarketRepository>();
builder.Services.AddScoped<WardrobeQueryHandler>(); builder.Services.AddScoped<WardrobeCommandHandler>();
builder.Services.AddScoped<OutfitQueryHandler>(); builder.Services.AddScoped<OutfitCommandHandler>();
builder.Services.AddScoped<MarketQueryHandler>(); builder.Services.AddScoped<MarketCommandHandler>(); builder.Services.AddSingleton<OutfitEngine>();
builder.Services.AddAntiforgery(o => { o.HeaderName = "X-CSRF-TOKEN"; o.Cookie.Name = "Thread.Antiforgery"; o.Cookie.HttpOnly = true; });
builder.Services.AddControllers(o => o.Filters.Add<CsrfFilter>());
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 40, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var proxy in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
        o.KnownProxies.Add(System.Net.IPAddress.Parse(proxy));
});
var app = builder.Build();
app.UseForwardedHeaders();
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    if (context.Request.Path.StartsWithSegments("/api")) context.Response.Headers.CacheControl = "no-store";
    try { await next(); }
    catch (DomainException ex) { context.Response.StatusCode = ex.Status; await context.Response.WriteAsJsonAsync(new { title = ex.Message, status = ex.Status }); }
    catch (Exception ex) when (!context.Response.HasStarted)
    { app.Logger.LogError(ex, "Request failed: {Path}", context.Request.Path); context.Response.StatusCode = 500; await context.Response.WriteAsJsonAsync(new { title = "Something went wrong. Please try again.", status = 500 }); }
});
app.UseStaticFiles(); app.UseRouting(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization();
app.MapGet("/api/csrf", (HttpContext c, IAntiforgery af) => Results.Ok(new { token = af.GetAndStoreTokens(c).RequestToken }));
app.MapGet("/api/config", () => Results.Ok(new { demoMode = app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Demo:Enabled"), providers, Vocabulary.Categories, Vocabulary.Seasons, Vocabulary.Styles, Vocabulary.Eras, Vocabulary.Palettes, Vocabulary.Colors, Vocabulary.Images, Vocabulary.Trends }));
app.MapGet("/api/health", async (WardrobeDb db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503));
app.MapControllers(); app.MapFallbackToFile("index.html");
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WardrobeDb>(); await db.Database.MigrateAsync();
    if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Demo:Enabled")) await DemoSeed.Run(db, scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>());
}
await app.RunAsync();
public partial class Program { }
