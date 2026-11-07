# Development checkpoints for the Thread course

These branches reconstruct a cumulative teaching path from the original repository to the current blue application. They are independent reference checkpoints with linear ancestry, not a claim about the historical order of the original implementation. The original application history is preserved; learning checkpoints live on separate branches.

`course/00-start` is the original repository commit containing only `LICENSE` and `.gitignore`. There is no website to run or screenshot at Stages 00-04; Stage 05 adds an API without a frontend. The browser application starts at Stage 06.

## Branch map

| Stage | Reference branch | What is added | Automated test cases | Commit |
| --- | --- | --- | --- | --- |
| 00 | [`course/00-start`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/00-start) | Original license and ignore rules; no application. | No application | [`7496d980`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/7496d98063efc42a40d18adff2ab5b6ed7ed303d) |
| 01 | [`course/01-foundation`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/01-foundation) | Translate the wardrobe problem into an MVP and establish the .NET solution boundary. | Build only | [`f960b5e0`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/f960b5e035fd46b810f85f4f4f414cb4cef7494d) |
| 02 | [`course/02-domain`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/02-domain) | Model garments, outfits, listings and orders, then implement deterministic outfit matching as pure C# logic. | 8 | [`48895d21`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/48895d214200eb44e24fa74fb6fbaaabafa8e6d0) |
| 03 | [`course/03-cqrs`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/03-cqrs) | Separate queries from commands and depend on repository contracts instead of a database implementation. | 8 | [`10a50f1f`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/10a50f1f857c59aa15dcc817641ee4334b20bef6) |
| 04 | [`course/04-persistence`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/04-persistence) | Implement repository contracts with EF Core, add the relational schema, migration and seed data. | 8 | [`0ced72d3`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/0ced72d31e49ee14fe94bf7a912611a8e685c71b) |
| 05 | [`course/05-api`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/05-api) | Expose the application through authenticated MVC controllers with cookies, CSRF, activation/recovery and ownership checks. | 17 | [`bfd39d36`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/bfd39d36af24c1c931593ad7961938c8c6775036) |
| 06 | [`course/06-react-shell`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/06-react-shell) | Build the client shell, shared controls, Redux store, RTK Query and real account forms. | 19 | [`21db1b33`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/21db1b33ed505786a305337f5af6a1db794a47b4) |
| 07 | [`course/07-wardrobe`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/07-wardrobe) | Connect garment forms, favorites and combined search/category/color/season/style/era filters to the API. | 19 | [`437ac19f`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/437ac19f8938399fd30ecbf255396f35b50e0a0e) |
| 08 | [`course/08-outfits`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/08-outfits) | Generate explainable combinations, save a named look and create or revoke an anonymous public link. | 19 | [`ba11eab8`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/ba11eab8ade3a5ef1dd388a11d6f6906efc51e6c) |
| 09 | [`course/09-community`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/09-community) | Add sell/lend/giveaway listings and buyer/seller reservation transitions without payment processing. | 19 | [`e9a86e14`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/e9a86e14dc2ce4cda210a3e78186c770885affaa) |
| 10 | [`course/10-delivery`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/10-delivery) | Package the complete original-theme MVP, document provider setup and deployment, and add reproducible API-data exports. | 19 | [`5aaa479d`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/5aaa479d19fb3f472008f047231d67fefc7b278c) |
| 11 | [`course/11-blue-design`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/tree/course/11-blue-design) | Apply the current cobalt palette, Manrope type, desktop filter rail and mobile bottom navigation across all features. | 19 | [`4122ff64`](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/commit/4122ff647b6b3e1165393d0157c5a7de7a939143) |

Each branch from Stage 01 has its own `COURSE_STAGE.md` with prerequisites, commands, observable checks and the next checkpoint. Stages 02-04 have eight domain test cases; Stage 05 adds HTTP/Identity/SQLite integration coverage for 17 backend cases. Stages 06-11 add two Redux tests, for 19 total.

## Work without overwriting your progress

Install .NET 10 and Node.js 24. Your GitHub account needs access to this repository. Clone with your usual GitHub authentication, then fetch all reference branches. Save or commit your own work before switching branches.

```sh
git clone https://github.com/DotDimonNet/FromZeroToCodeWardrobe.git
cd FromZeroToCodeWardrobe
git fetch origin
git switch -c my-stage-07 origin/course/06-react-shell
```

Build the Stage 07 feature on `my-stage-07` and commit your completed exercise. Compare that commit against the completed reference when you are ready:

```sh
git diff HEAD origin/course/07-wardrobe -- src client
git diff origin/course/06-react-shell..origin/course/07-wardrobe --stat
```

To inspect the completed example in a separate local branch:

```sh
git switch -c inspect-stage-07 origin/course/07-wardrobe
```

Do not reset your personal work to a reference branch. Checkpoints are examples to compare against; use your own branch for exercises.

## Run the appropriate checkpoint

| Checkpoint | Commands from repository root | Observable result |
| --- | --- | --- |
| 01 | `dotnet build Wardrobe.sln -m:1 -p:UseSharedCompilation=false` | Empty Domain project compiles. |
| 02-04 | `dotnet build Wardrobe.sln -m:1 -p:UseSharedCompilation=false`, then `dotnet test Wardrobe.sln --no-build -m:1 -p:UseSharedCompilation=false` | All current layers compile and eight domain cases pass. No host yet. |
| 05 | `dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false`, then `dotnet run --project src/Wardrobe.Api --launch-profile Wardrobe.Api` | 17 cases pass; API available at `http://localhost:5080/api/config`. |
| 06-11 | `npm ci --prefix client`, then `npm run dev` | Single same-origin website at `http://localhost:3000`; React assets are served by C#. |

At Stage 06 the account forms, navigation and Redux plumbing are real; future feature pages explicitly identify their later stage. Stage 07 adds wardrobe forms and filters, Stage 08 outfits and public links, and Stage 09 community listings and reservations. Stages 06-10 retain the original green editorial design. Stage 11 applies the blue redesign.

The `npm run dev` command builds the frontend and backend before starting the API; first startup can take a minute. Use **Explore the demo**. Do not start a second Vite server for this workflow. Development mode seeds sample data in SQLite; Google/Facebook and SMTP still require provider credentials.

## Validation and scope

The separate `.github/workflows/course-checkpoint.yml` runs on `course/**` branch pushes and supports manual dispatch. It builds only the layers that exist at that stage; Node setup begins at Stage 06. The original application CI workflow is unchanged.

Local .NET solution builds passed with zero warnings/errors at Stages 01-05. Eight domain cases passed at Stages 02-04; all 17 backend cases passed at Stage 05. Strict TypeScript/Vite builds and both frontend tests passed at each Stage 06-11. All 11 published checkpoint workflows completed successfully on 8 November 2026; Stage 00 intentionally has no application or workflow. All published source trees were checked against local file hashes with zero mismatches.

The Stage 11 application source matches the blue version at commit `8d52af46bdcebfd76ccbe8ac071838d2f6dc58fc`. Its README course link, `COURSE_STAGE.md`, and course verification workflow are the intentional learning additions.

Deployment remains a separate operational step. This repository does not provision a public host, configure real OAuth/SMTP credentials, process card payments or validate a production environment automatically. Screenshot and video captions should distinguish an actual browser/API session from a static or read-only preview.

## Published CI record

| Branch | Run | Result |
| --- | --- | --- |
| `course/01-foundation` | [Run 42426054775](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426054775) | success |
| `course/02-domain` | [Run 42426107359](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426107359) | success |
| `course/03-cqrs` | [Run 42426127692](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426127692) | success |
| `course/04-persistence` | [Run 42426156729](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426156729) | success |
| `course/05-api` | [Run 42426178785](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426178785) | success |
| `course/06-react-shell` | [Run 42426221640](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426221640) | success |
| `course/07-wardrobe` | [Run 42426240567](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426240567) | success |
| `course/08-outfits` | [Run 42426261033](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426261033) | success |
| `course/09-community` | [Run 42426281036](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426281036) | success |
| `course/10-delivery` | [Run 42426323611](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426323611) | success |
| `course/11-blue-design` | [Run 42426358401](https://github.com/DotDimonNet/FromZeroToCodeWardrobe/actions/runs/42426358401) | success |
