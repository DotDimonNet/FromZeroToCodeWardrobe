# Build Thread, step by step

Use this alongside the source. Each stage explains a decision, names the implementation and gives a check you can perform. Start from a branch in your own repository; commit after each working stage.

## 1. Translate a need into a task

Need: “I want to find something to wear from clothes I already own.” Turn it into a story and an acceptance example: given available summer pieces, generating a summer outfit returns a top, a bottom and shoes owned by the signed-in person. Write the non-goals in `MVP.md` before implementation.

Exercise: add an acceptance example for a piece in the laundry. Which API boundary should enforce it?

## 2. Create the solution boundaries

```sh
dotnet new sln -n Wardrobe --format sln
dotnet new classlib -n Wardrobe.Domain -o src/Wardrobe.Domain
dotnet new classlib -n Wardrobe.Application -o src/Wardrobe.Application
dotnet new classlib -n Wardrobe.Infrastructure -o src/Wardrobe.Infrastructure
dotnet new webapi --use-controllers -n Wardrobe.Api -o src/Wardrobe.Api
```

The finished repository already contains these projects. Dependencies point inward: Application → Domain; Infrastructure → Application; API → Infrastructure and Application. `Directory.Build.props` centralizes .NET 10, nullable references, implicit imports and warnings-as-errors.

Check: Domain builds without EF Core or ASP.NET dependencies. Explain why a change of database should not change the outfit matching algorithm.

## 3. Model the data and invariants

Read `Domain/Models.cs` and `Domain/OutfitEngine.cs`. `Garment`, `Outfit`, `Listing` and `Order` represent different business concepts. Never use a client-supplied owner ID. `Vocabulary` keeps accepted values controlled and validates text lengths.

The outfit algorithm filters availability/season/style/era, builds top-bottom-shoes combinations, applies palette rules and ranks them. Neutral colors are deliberately treated as compatible companions. Monochrome permits chromatic hue distances up to 40°; the complementary rule permits similar or near-opposite hues. These simplified rules are explainable course logic, not color science or personal styling advice.

The search considers at most 20 eligible pieces in each required category, ordered by ID, and returns at most three combinations. This bounds work at 8,000 candidates. It is a documented MVP tradeoff: a large wardrobe may need a better candidate-selection policy.

Exercise: add an optional outerwear rule without requiring a coat in summer. Write a domain test before changing the generator.

## 4. Separate reads from writes

Read `Application/Contracts.cs` and `Handlers.cs`. `GetWardrobe` is a query; `AddGarment` is a command. Query handlers return DTOs. Command handlers validate and change state through repository contracts, then commit through `IUnitOfWork`.

CQRS is a separation of responsibilities. A mediator library is optional. This implementation uses direct typed handler injection so beginners can follow every call.

Check: `GarmentsController` delegates its POST to a command handler instead of editing the EF context itself.

## 5. Persist the model

Read `Infrastructure/Persistence.cs`. `WardrobeDb` extends `IdentityDbContext<AppUser>` so identity and wardrobe records share a transactional database. Index owner IDs and public share tokens. The outfit join table prevents duplicate pieces; foreign keys prevent deleting a garment still used by a saved look.

```sh
dotnet tool restore
dotnet ef migrations add YourChange --project src/Wardrobe.Infrastructure --startup-project src/Wardrobe.Api
```

The included initial migration is applied on startup. Do not create a second initial migration. SQLite files are ignored by Git. For the local demo, they live beside the running API's content root; Docker stores them in `/data`.

Exercise: inspect the migration's tables. Explain what happens if someone tries to remove a garment referenced by an outfit.

## 6. Protect the account boundary

Read `Api/Controllers/AuthController.cs`, `ApiSupport.cs` and `Program.cs`. ASP.NET Identity hashes passwords and supplies confirmation/reset tokens. Cookies are HttpOnly; production cookies are Secure. Passwords require at least ten characters, uppercase/lowercase, a digit and a symbol. Five failed password attempts lock an account for fifteen minutes. Auth routes have an IP rate limit.

The frontend fetches `/api/csrf` before every unsafe request and sends `X-CSRF-TOKEN`. A global MVC filter verifies it, including registration and login requests. Owner IDs come from authenticated claims; repository queries constrain every private read/update to that owner.

Test registration → activation → login → logout → reset → login with the new password. Development-only links make this possible without sending email. Add SMTP before a public deployment.

Google and Facebook use server-side OAuth redirects. An existing email is not silently linked to a new external identity. Facebook accounts need email activation; Google can use the provider's verified-email claim. See `DEPLOYMENT.md` for credentials and callback URLs.

## 7. Build the React state model

Read `client/src/store.ts`. The Redux UI slice holds navigation, filters, outfit preferences and notifications. RTK Query owns API loading/error/data state and invalidates cached lists after mutations. Authentication tokens are not stored in localStorage.

Components are grouped by feature: `Wardrobe.tsx`, `Outfits.tsx`, `Market.tsx`, `Account.tsx`. `ui.tsx` contains shared dialogs, errors, fields, buttons and request-state helpers. The CSS defines a responsive blue design with reduced-motion support. Follow the [design system](DESIGN_SYSTEM.md) for palette, typography, catalog filters, mobile navigation and visual checks.

Exercise: add a “sort favorites first” option and preserve filters when navigating away and back. Avoid duplicating the API data into a second Redux slice.

## 8. Deliver one vertical slice

Trace Add a piece: form state → RTK Query mutation → CSRF validation → MVC controller → `WardrobeCommandHandler` → repository → EF save → response DTO → cache invalidation → refreshed gallery.

Check empty input, unsupported category, an API failure and repeated clicks while saving. The button becomes disabled while the request is running; error text stays in the dialog so the entered values are preserved.

## 9. Generate, save and share a look

The server reruns validation when saving; it does not trust an earlier suggestion. This catches a garment made unavailable between generation and saving. Sharing creates a random 24-byte token and exposes only that outfit. Turning sharing off removes the token, making the old link invalid.

Exercise: generate a look, mark a required piece unavailable in another tab, then attempt to save the old result. The server must reject it.

## 10. Make reservations safe

Read `MarketRepository.ReserveAsync` and `ResolveAsync`. A transaction combines a conditional `Available=true → false` update with order creation. Success requires exactly one affected row. The order price comes from the listing, not the browser.

Transitions: Requested → Accepted → Completed; Requested → Declined; Requested/Accepted → Cancelled by the buyer. Role and current state are checked for each transition. Loan completion represents the item's return; sale/giveaway completion represents handover.

Check with two accounts. Try reserving the same listing simultaneously and cancelling after completion. The integration tests exercise these cases against a real SQLite database.

## 11. Verify the risks that matter

Run the commands in the README. Domain tests cover matching constraints. HTTP integration tests run the actual ASP.NET application with migrations, Identity, cookies, CSRF and a temporary SQLite file. Frontend tests cover combined filters and preference persistence. The application build checks strict TypeScript and C# warnings.

No test claims to prove live Google/Facebook or SMTP behavior without credentials. Docker and public ingress also require environment-specific smoke tests.

## 12. Ship and learn

GitHub Actions produces an app artifact after successful checks. Run the optional container workflow when ready. Deploy one instance with a persistent disk, HTTPS, encryption-key persistence, SMTP and a fresh database; disable demo mode. Follow `DEPLOYMENT.md` and test the core journeys on the deployed domain.

Ask real users to complete the smallest useful loop, note where they hesitate and change one thing at a time. Keep the next iteration tied to an observed problem.
