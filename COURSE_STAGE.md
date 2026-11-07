# Stage 04 SQLite repositories and Identity persistence

Branch: `course/04-persistence`. Start from `course/03-cqrs`.

Implement repository contracts with EF Core, add the relational schema, migration and seed data.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
```

Infrastructure compiles and eight domain cases pass. The database is not started yet; the API host in Stage 05 applies the migration.

## Compare your work

```sh
git diff origin/course/03-cqrs..origin/course/04-persistence --stat
git diff origin/course/03-cqrs..origin/course/04-persistence -- src client
```

Next checkpoint: `course/05-api`.
