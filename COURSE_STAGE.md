# Stage 03 Application contracts and CQRS

Branch: `course/03-cqrs`. Start from `course/02-domain`.

Separate queries from commands and depend on repository contracts instead of a database implementation.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

Application and Domain compile; eight domain cases pass. Trace AddGarment through its command handler and unit-of-work contract.

## Compare your work

```sh
git diff origin/course/02-domain..origin/course/03-cqrs --stat
git diff origin/course/02-domain..origin/course/03-cqrs -- src client
```

Next checkpoint: `course/04-persistence`.
