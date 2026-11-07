using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Wardrobe.Application;
using Wardrobe.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Wardrobe.Infrastructure;
namespace Wardrobe.Api;

public class AppClaimsFactory(UserManager<AppUser> users, RoleManager<IdentityRole> roles, IOptions<IdentityOptions> options) : UserClaimsPrincipalFactory<AppUser, IdentityRole>(users, roles, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AppUser user)
    { var claims = await base.GenerateClaimsAsync(user); claims.AddClaim(new Claim("display_name", user.DisplayName)); return claims; }
}

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public string Id => accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    public string DisplayName => accessor.HttpContext?.User.FindFirstValue("display_name") ?? "Member";
}
public class CsrfFilter(IAntiforgery antiforgery) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (HttpMethods.IsGet(context.HttpContext.Request.Method) || HttpMethods.IsHead(context.HttpContext.Request.Method) || HttpMethods.IsOptions(context.HttpContext.Request.Method)) return;
        try { await antiforgery.ValidateRequestAsync(context.HttpContext); }
        catch (AntiforgeryValidationException) { context.Result = new ObjectResult(new ProblemDetails { Title = "Your session changed. Refresh the page and try again.", Status = 400 }) { StatusCode = 400 }; }
    }
}
public interface IAccountMailer { bool Configured { get; } Task Send(string email, string subject, string link); }
public class AccountMailer(IConfiguration config) : IAccountMailer
{
    public bool Configured => !string.IsNullOrWhiteSpace(config["Smtp:Host"]) && !string.IsNullOrWhiteSpace(config["Smtp:From"]);
    public async Task Send(string email, string subject, string link)
    {
        if (!Configured) throw new DomainException("Email delivery is not configured on this server.", 503);
        using var message = new MailMessage(config["Smtp:From"]!, email, subject, $"{subject}\n\nOpen this link to continue:\n{link}\n\nIf you did not request this, you can ignore this email.");
        using var smtp = new SmtpClient(config["Smtp:Host"], config.GetValue("Smtp:Port", 587)) { EnableSsl = true };
        if (!string.IsNullOrEmpty(config["Smtp:User"])) smtp.Credentials = new NetworkCredential(config["Smtp:User"], config["Smtp:Password"]);
        await smtp.SendMailAsync(message);
    }
}
