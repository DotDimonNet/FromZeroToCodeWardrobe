# Silent walkthrough and build notes

The accompanying `Thread_Walkthrough.mp4` is a 1920×1080 silent video with readable implementation notes. It is an **annotated screen walkthrough**, not a recording of live browser-to-API interactions.

The browser preview host could not initialize CoreCLR. To preserve visual fidelity without substituting a different backend, the walkthrough uses the actual React components rendered with responses exported from the real ASP.NET application running in its integration-test host. The export creates a look, requests a reservation and accepts it through real controllers, handlers and SQLite transactions. Each captured screen is labeled accordingly.

## Video chapters

| Time | Screen | Implementation lesson |
| --- | --- | --- |
| 00:00 | Product overview | Define the smallest useful wardrobe and exchange loop. |
| 00:12 | Sign-in | Identity, activation, recovery, cookies, CSRF and provider configuration. |
| 00:27 | Wardrobe home | Domain entities, ownership, repositories and SQLite. |
| 00:40 | Gallery | Combined filters, Redux state, RTK Query and licensed assets. |
| 00:53 | Garment editor | Trace a vertical slice from form through command to database. |
| 01:08 | Outfit studio | Season/style/era/palette constraints and explainable ranking. |
| 01:24 | Saved looks | Persist combinations and create/revoke public share tokens. |
| 01:39 | Sharing circle | Sell, lend and give away; reservation-based MVP scope. |
| 01:53 | Reservations | Role-controlled transitions and atomic inventory updates. |
| 02:09 | Profile | Account maintenance and development-only role switching. |
| 02:22 | Mobile layouts | Responsive composition and accessibility considerations. |
| 02:35 | Architecture and delivery | Tests, GitHub workflows and local start commands. |

## Run a live demonstration locally

1. Follow the README's startup commands and open `http://localhost:3000`.
2. Explore the demo as Alex. Add a sample garment and find it using combined filters.
3. Generate a neutral outfit in Outfit studio. Save it as “My everyday edit”.
4. Open Saved looks. Enable sharing, open the URL in a signed-out browser, then revoke it and confirm the old link stops working.
5. Open Sharing circle and request an available piece. Include a pickup suggestion in the message.
6. Open the profile and switch the demo role to Maya. Accept the request in Reservations; complete it after the simulated handover.
7. Switch back to Alex and inspect the updated status.
8. Sign out. Register a new `example.test` account, follow the labeled development activation link and sign in. Test password recovery with the development reset link.
9. Configure real SMTP and OAuth credentials separately before demonstrating live provider sign-in.

The static walkthrough does not validate browser event handling, real social-provider redirects, email delivery or a production ingress. The repository's automated tests cover the actual API's business and security boundaries; perform the deployment smoke tests in `DEPLOYMENT.md` on your real host.

## Reproduce the visual export

This optional tooling is not part of the production app:

```sh
npm ci --prefix client
npm --prefix client run build
dotnet build tools/DemoExport -m:1 -p:UseSharedCompilation=false
dotnet run --project tools/DemoExport --no-build -- artifacts/demo-data.json
node scripts/render-walkthrough.mjs
node artifacts/render-walkthrough.cjs artifacts/demo-data.json artifacts/walkthrough
```

Serve `artifacts/walkthrough` with a local static server and capture the named pages. `scripts/make-demo-video.py` assembles those screen images with notes using Pillow and FFmpeg; its docstring describes the expected paths. Keep the explicit static-walkthrough label on any reused screen or video. All sample people and accounts are fictional.

## Validation record

- C# solution builds with warnings treated as errors.
- 17 backend/domain/integration tests passed against SQLite and ASP.NET Identity.
- 2 frontend state tests passed; strict TypeScript and Vite production build passed.
- NuGet audit including transitive dependencies: no known vulnerable packages at the time of this run.
- npm audit including development dependencies: no known vulnerabilities at the time of this run.
- Desktop and 390 px rendered React layouts inspected visually.
- Google/Facebook, real SMTP, Docker runtime and public production deployment: configuration supplied, live environment verification pending.
