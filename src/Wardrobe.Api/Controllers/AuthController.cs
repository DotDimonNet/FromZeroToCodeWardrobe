using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;
using Wardrobe.Domain;
using Wardrobe.Infrastructure;
namespace Wardrobe.Api.Controllers;

public record RegisterInput([EmailAddress] string Email, [MinLength(10), MaxLength(128)] string Password, string DisplayName);
public record LoginInput([EmailAddress] string Email, string Password);
public record EmailInput([EmailAddress] string Email);
public record TokenInput(string UserId, string Token);
public record ResetInput(string UserId, string Token, [MinLength(10), MaxLength(128)] string Password);
public record ProfileInput(string DisplayName, string City);
public record PasswordInput(string CurrentPassword, [MinLength(10), MaxLength(128)] string NewPassword);
public record UserDto(string Id, string Email, string DisplayName, string City, bool HasPassword);

[ApiController, Route("api/auth"), EnableRateLimiting("auth")]
public class AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn, IAccountMailer mailer, IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    private bool Demo => env.IsDevelopment() && config.GetValue<bool>("Demo:Enabled");
    private static string Encode(string token) => WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
    private static string Decode(string token)
    { try { return Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token)); } catch (FormatException) { throw new DomainException("This link is invalid or expired."); } }
    private async Task<UserDto> Dto(AppUser u) => new(u.Id, u.Email!, u.DisplayName, u.City, await users.HasPasswordAsync(u));
    private static void Check(IdentityResult r)
    { if (!r.Succeeded) throw new DomainException(string.Join(" ", r.Errors.Select(e => e.Description))); }
    private async Task SignIn(AppUser u) => await signIn.SignInWithClaimsAsync(u, false, [new Claim("display_name", u.DisplayName)]);
    private async Task<string?> SendLink(AppUser u, string kind)
    {
        var token = kind == "activate" ? await users.GenerateEmailConfirmationTokenAsync(u) : await users.GeneratePasswordResetTokenAsync(u);
        var path = $"/?flow={kind}&userId={Uri.EscapeDataString(u.Id)}&token={Encode(token)}";
        if (Demo && !mailer.Configured) return path;
        var baseUrl = config["PublicBaseUrl"]?.TrimEnd('/') ?? throw new DomainException("Account email is not configured.", 503);
        await mailer.Send(u.Email!, kind == "activate" ? "Activate your Thread account" : "Reset your Thread password", baseUrl + path); return null;
    }
    [HttpGet("me")]
    public async Task<IActionResult> Me() => Ok(new { user = User.Identity?.IsAuthenticated == true ? await Dto((await users.GetUserAsync(User))!) : null });
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterInput input)
    {
        if (!Demo && !mailer.Configured) throw new DomainException("Registration is waiting for email delivery configuration.", 503);
        var email = input.Email.Trim();
        if (await users.FindByEmailAsync(email) is not null) return Ok(new { message = "If this address can be registered, an activation link will arrive shortly." });
        var user = new AppUser { UserName = email, Email = email, DisplayName = Vocabulary.Text(input.DisplayName, 60, "Name") };
        Check(await users.CreateAsync(user, input.Password));
        var developmentLink = await SendLink(user, "activate");
        return Ok(new { message = "Check your email to activate your account before signing in.", developmentLink });
    }
    [HttpPost("activate")]
    public async Task<IActionResult> Activate(TokenInput input)
    {
        var u = await users.FindByIdAsync(input.UserId) ?? throw new DomainException("This link is invalid or expired.");
        var result = await users.ConfirmEmailAsync(u, Decode(input.Token));
        if (!result.Succeeded) throw new DomainException("This link is invalid or expired. Request another activation email.");
        return Ok(new { message = "Your account is activated. You can now sign in." });
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginInput input)
    {
        var u = await users.FindByEmailAsync(input.Email.Trim());
        if (u is null) throw new DomainException("Email or password is incorrect.", 401);
        var result = await signIn.CheckPasswordSignInAsync(u, input.Password, true);
        if (result.IsLockedOut) throw new DomainException("Too many attempts. Try again in 15 minutes.", 429);
        if (result.IsNotAllowed) throw new DomainException("Activate your account using the link in your email first.", 403);
        if (!result.Succeeded) throw new DomainException("Email or password is incorrect.", 401);
        await SignIn(u); return Ok(new { user = await Dto(u) });
    }
    [HttpPost("demo")]
    public async Task<IActionResult> DemoLogin([FromQuery] bool seller = false)
    {
        if (!Demo) return NotFound();
        var u = await users.FindByEmailAsync(seller ? DemoSeed.SellerEmail : DemoSeed.Email) ?? throw new DomainException("Demo account unavailable.", 503);
        await SignIn(u); return Ok(new { user = await Dto(u) });
    }
    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout() { await signIn.SignOutAsync(); return Ok(new { message = "Signed out." }); }
    [HttpPost("forgot"), HttpPost("resend-activation")]
    public async Task<IActionResult> Recovery(EmailInput input)
    {
        if (!Demo && !mailer.Configured) throw new DomainException("Account emails are not configured on this server.", 503);
        var u = await users.FindByEmailAsync(input.Email.Trim()); string? developmentLink = null;
        var activation = Request.Path.Value!.EndsWith("resend-activation", StringComparison.Ordinal);
        if (u is not null && (!activation || !u.EmailConfirmed)) developmentLink = await SendLink(u, activation ? "activate" : "reset");
        return Ok(new { message = "If the account is eligible, an email will arrive shortly.", developmentLink });
    }
    [HttpPost("reset")]
    public async Task<IActionResult> Reset(ResetInput input)
    {
        var u = await users.FindByIdAsync(input.UserId) ?? throw new DomainException("This link is invalid or expired.");
        var result = await users.ResetPasswordAsync(u, Decode(input.Token), input.Password);
        if (!result.Succeeded) throw new DomainException("Could not reset the password. Use a fresh link and a password with 10+ characters, an uppercase letter, lowercase letter, digit and symbol.");
        // UpdateSecurityStamp invalidates existing sessions on their next validation.
        await users.UpdateSecurityStampAsync(u); return Ok(new { message = "Password updated. Sign in with your new password." });
    }
    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> Profile(ProfileInput input)
    {
        var u = (await users.GetUserAsync(User))!; u.DisplayName = Vocabulary.Text(input.DisplayName, 60, "Name"); u.City = Vocabulary.Text(input.City, 60, "City", false);
        Check(await users.UpdateAsync(u)); await SignIn(u); return Ok(new { user = await Dto(u) });
    }
    [Authorize, HttpPost("password")]
    public async Task<IActionResult> Password(PasswordInput input)
    {
        var u = (await users.GetUserAsync(User))!; Check(await users.ChangePasswordAsync(u, input.CurrentPassword, input.NewPassword));
        await SignIn(u); return Ok(new { message = "Password changed." });
    }
    [HttpGet("external/{provider}")]
    public async Task<IActionResult> External(string provider)
    {
        if (provider is not ("Google" or "Facebook") || !(await signIn.GetExternalAuthenticationSchemesAsync()).Any(s => s.Name == provider)) return NotFound();
        var properties = signIn.ConfigureExternalAuthenticationProperties(provider, "/api/auth/external-callback");
        return Challenge(properties, provider);
    }
    [HttpGet("external-callback")]
    public async Task<IActionResult> Callback()
    {
        var info = await signIn.GetExternalLoginInfoAsync();
        if (info is null) return Redirect("/?authError=External%20sign-in%20was%20not%20completed.");
        var existing = await users.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        if (existing is not null)
        {
            if (!existing.EmailConfirmed) return Redirect("/?authError=Activate%20your%20account%20using%20your%20email%20first.");
            if (await users.IsLockedOutAsync(existing)) return Redirect("/?authError=Account%20temporarily%20locked.");
            await SignIn(existing); await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme); return LocalRedirect("/");
        }
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email)) return Redirect("/?authError=The%20provider%20did%20not%20return%20an%20email%20address.");
        // Do not silently link identities by matching email: this would permit account takeover.
        if (await users.FindByEmailAsync(email) is not null) return Redirect("/?authError=This%20email%20already%20has%20an%20account.%20Use%20its%20original%20sign-in%20method.");
        var verified = info.LoginProvider == "Google" && string.Equals(info.Principal.FindFirstValue("email_verified"), "true", StringComparison.OrdinalIgnoreCase);
        if (!verified && !Demo && !mailer.Configured) return Redirect("/?authError=Email%20verification%20is%20not%20configured.");
        var u = new AppUser { Email = email, UserName = email, DisplayName = Vocabulary.Text(info.Principal.FindFirstValue(ClaimTypes.Name) ?? "Member", 60, "Name"), EmailConfirmed = verified };
        Check(await users.CreateAsync(u)); Check(await users.AddLoginAsync(u, info));
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        if (!verified) { await SendLink(u, "activate"); return Redirect("/?authError=Check%20your%20email%20to%20activate%20your%20account."); }
        await SignIn(u); return LocalRedirect("/");
    }
}
