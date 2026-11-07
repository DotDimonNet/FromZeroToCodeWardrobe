# Stage 02 Domain model and outfit rules

Branch: `course/02-domain`. Start from `course/01-foundation`.

Model garments, outfits, listings and orders, then implement deterministic outfit matching as pure C# logic.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

Eight domain test cases pass. Incompatible seasons, unavailable garments and invalid palettes are rejected.

## Compare your work

```sh
git diff origin/course/01-foundation..origin/course/02-domain --stat
git diff origin/course/01-foundation..origin/course/02-domain -- src client
```

Next checkpoint: `course/03-cqrs`.
