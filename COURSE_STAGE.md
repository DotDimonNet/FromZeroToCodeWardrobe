# Stage 05 MVC Web API and account boundary

Branch: `course/05-api`. Start from `course/04-persistence`.

Expose the application through authenticated MVC controllers with cookies, CSRF, activation/recovery and ownership checks.

This is a reconstructed teaching checkpoint in a cumulative sequence. It is not a claim about the chronological order in which the original project was authored. Earlier branches intentionally contain only the layers or screens taught so far.

## Prerequisites

Install the .NET 10 SDK. Run commands from the repository root. Save your own work before switching branches; make a personal working branch rather than overwriting the reference checkpoint.

## Run and verify

```sh
dotnet test Wardrobe.sln -m:1 -p:UseSharedCompilation=false
# Start the API in Development at http://localhost:5080
dotnet run --project src/Wardrobe.Api --launch-profile Wardrobe.Api
```

All 17 backend cases pass against SQLite. GET /api/config responds; private endpoints require a session. The home page has no frontend yet.

## Compare your work

```sh
git diff origin/course/04-persistence..origin/course/05-api --stat
git diff origin/course/04-persistence..origin/course/05-api -- src client
```

Next checkpoint: `course/06-react-shell`.
