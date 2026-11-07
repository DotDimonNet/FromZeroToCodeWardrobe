# Stage 10 Packaging deployment and course documentation

Branch: `course/10-delivery`. Start from `course/09-community`.

Package the complete original-theme MVP, document provider setup and deployment, and add reproducible API-data exports.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK, Node.js 24 and npm. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
npm ci --prefix client
npm run dev
# Optional local Docker demo
docker compose up --build
```

The complete original-theme application builds and all 19 tests pass. Docker/provider/public-host smoke tests still require their target environment.

The root development command builds React, copies the output into the C# API, builds .NET, and starts a single same-origin website. Do not run a second frontend server for this walkthrough. Initial startup can take a minute. Development demo data is seeded automatically; use Explore the demo. Google/Facebook/SMTP need provider configuration and are not required for local study.

Validation commands:

```sh
npm --prefix client test
npm --prefix client run build
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

## Compare your work

```sh
git diff origin/course/09-community..origin/course/10-delivery --stat
git diff origin/course/09-community..origin/course/10-delivery -- src client
```

Next checkpoint: `course/11-blue-design`.
