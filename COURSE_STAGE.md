# Stage 01 Scope and solution foundation

Branch: `course/01-foundation`. Start from `course/00-start`.

Translate the wardrobe problem into an MVP and establish the .NET solution boundary.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
dotnet build Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

The empty Domain class library compiles. Explain the MVP exclusions before writing features.

## Compare your work

```sh
git diff origin/course/00-start..origin/course/01-foundation --stat
git diff origin/course/00-start..origin/course/01-foundation -- src client
```

Next checkpoint: `course/02-domain`.
