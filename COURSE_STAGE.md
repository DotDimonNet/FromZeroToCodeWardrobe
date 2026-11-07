# Stage 11 Final responsive blue design

Branch: `course/11-blue-design`. Start from `course/10-delivery`.

Apply the current cobalt palette, Manrope type, desktop filter rail and mobile bottom navigation across all features.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK, Node.js 24 and npm. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
npm ci --prefix client
npm run dev
```

The complete current blue application builds and all 19 tests pass. Check desktop and phone layouts, mobile filters and keyboard dialog dismissal.

The root development command builds React, copies the output into the C# API, builds .NET, and starts a single same-origin website. Do not run a second frontend server for this walkthrough. Initial startup can take a minute. Development demo data is seeded automatically; use Explore the demo. Google/Facebook/SMTP need provider configuration and are not required for local study.

Validation commands:

```sh
npm --prefix client test
npm --prefix client run build
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

## Compare your work

```sh
git diff origin/course/10-delivery..origin/course/11-blue-design --stat
git diff origin/course/10-delivery..origin/course/11-blue-design -- src client
```

This checkpoint matches the current blue application source. The additional course guide and checkpoint workflow exist to support learning.
