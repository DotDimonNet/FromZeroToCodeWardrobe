# Configure and deploy

## Local development

Use `npm ci --prefix client` then `npm run dev`. This builds one same-origin site at `http://localhost:3000`, using the Development configuration and SQLite. For quicker UI iteration, run `dotnet run --project src/Wardrobe.Api` on port 5080 and `npm --prefix client run dev`; Vite proxies `/api` and OAuth callback paths to the API. Test OAuth against the API's registered origin or configure an exact matching callback for your dev proxy.

To rebuild the combined app after an edit, stop it and rerun `npm run dev`. No `.env` file is read automatically by ASP.NET; use environment variables or .NET user secrets. `.env.example` documents the names.

## Email

Set `Smtp:Host`, `Smtp:Port` (587 by default), `Smtp:From`, `Smtp:User` and `Smtp:Password`. The sender uses authenticated SMTP with STARTTLS. Use a provider supporting that transport; an implicit-TLS-only port 465 configuration is not supported by this simple adapter.

Set `PublicBaseUrl` to the exact public HTTPS origin, without a trailing slash. Confirmation/reset links use that configured origin, not the incoming Host header. Identity confirmation/reset tokens expire after two hours.

For local secrets:

```sh
dotnet user-secrets set 'Smtp:Host' 'smtp.your-provider.example' --project src/Wardrobe.Api
dotnet user-secrets set 'Smtp:From' 'wardrobe@your-domain.example' --project src/Wardrobe.Api
dotnet user-secrets set 'PublicBaseUrl' 'https://your-domain.example' --project src/Wardrobe.Api
```

Add the SMTP username/password through the same mechanism. Never commit them. In production, use your hosting platform's secret store.

## Google and Facebook

Register your own applications with the providers. The adapters intentionally remain disabled without both credential values.

| Provider | Server settings                                                            | Registered callback                   |
| -------- | -------------------------------------------------------------------------- | ------------------------------------- |
| Google   | `Authentication:Google:ClientId`, `Authentication:Google:ClientSecret`     | `https://YOUR_DOMAIN/signin-google`   |
| Facebook | `Authentication:Facebook:ClientId`, `Authentication:Facebook:ClientSecret` | `https://YOUR_DOMAIN/signin-facebook` |

For Facebook, the `ClientId` setting holds the Facebook App ID and `ClientSecret` holds the App Secret. Request email access, configure test users/allowed domains while the provider app is in development, and complete any provider review required for public use. Configure privacy-policy and data-deletion information before a public launch.

The provider handler completes its callback and then forwards to `/api/auth/external-callback`. Do not register that second application route as the provider callback.

Google's verified-email claim may activate a new account. Facebook's returned email is confirmed through this app's activation link. Existing email addresses are not silently linked to external accounts; users should use their original sign-in method. Explicit account linking is not implemented in this MVP.

Official references: [ASP.NET Core social authentication](https://learn.microsoft.com/aspnet/core/security/authentication/social/), [Google setup](https://learn.microsoft.com/aspnet/core/security/authentication/social/google-logins), [Facebook setup](https://learn.microsoft.com/aspnet/core/security/authentication/social/facebook-logins).

## GitHub delivery

1. Push your branch and open a pull request. `Build and test` checks both stacks and uploads the `thread-wardrobe` publish artifact.
2. Review the checks and merge when ready. GitHub Pages alone cannot run this C# API.
3. Optionally run **Actions → Publish container → Run workflow**. It uses GitHub's built-in token and publishes `ghcr.io/dotdimonnet/fromzerotocodewardrobe`, tagged with the commit SHA and `latest`.
4. Deploy the publish artifact on a .NET 10 host, or the container on a host supporting Linux containers and persistent volumes. This project does not automatically provision a hosting subscription.

## Production configuration

Use a **new database**; do not deploy the seeded demo database.

| Setting                         | Value / purpose                        |
| ------------------------------- | -------------------------------------- |
| `ASPNETCORE_ENVIRONMENT`        | `Production`                           |
| `Demo__Enabled`                 | `false`                                |
| `ConnectionStrings__Wardrobe`   | `Data Source=/data/wardrobe.db`        |
| `DataProtection__Path`          | `/data/keys` on the persistent volume  |
| `PublicBaseUrl`                 | Your HTTPS origin                      |
| `AllowedHosts`                  | Your public hostname(s)                |
| `Smtp__*`                       | Real email provider credentials        |
| `Authentication__Google__*`     | Google credentials, if enabled         |
| `Authentication__Facebook__*`   | Facebook credentials, if enabled       |
| `ReverseProxy__KnownProxies__0` | Actual ingress proxy IP, if applicable |

Double underscores map environment-variable names to ASP.NET configuration sections. Configure TLS at the host/ingress and redirect public HTTP traffic there. The container listens on port 8080. Trust forwarded headers only from your known proxy; this matters for secure cookies, OAuth redirect URLs and rate limits. Never clear the trusted-proxy list to accept arbitrary client-supplied headers.

Mount persistent storage at `/data`, writable by UID 1654, and run **one instance**. SQLite requires a durable filesystem, and data-protection keys must survive restarts so cookies and tokens remain valid. Back up the database consistently using SQLite's backup mechanism and separately protect encryption keys with restricted permissions or a managed key provider. This sample does not encrypt the key files at rest itself.

The app applies migrations at startup. For a larger deployment, move migrations to a controlled release step. Never share a SQLite file across horizontally scaled replicas. A managed SQL Server/PostgreSQL deployment requires another EF provider, provider-specific migrations and re-running reservation concurrency tests; simply changing the connection string is insufficient.

## Smoke test on the deployed origin

- `/api/health` returns 200 and reports `ok`.
- The site loads, including all local images and CSS.
- Registration sends an email; activation and reset links point to the correct HTTPS domain.
- Both configured OAuth providers complete their real redirect flows; cancellations show useful errors.
- One user's wardrobe is absent from another user's account.
- A public share URL works signed out, and stops working after revocation.
- A reservation can be accepted/completed; a second reservation cannot take the same piece.
- Restart the service and confirm records and existing sessions persist.
- Confirm `/api/auth/demo` returns 404 in Production, and no recovery response contains a development link.

This implementation was built and tested locally. Live provider sign-in, SMTP delivery, a Docker engine run and a public production deployment require the corresponding external environment and are not claimed as verified by the local tests.
