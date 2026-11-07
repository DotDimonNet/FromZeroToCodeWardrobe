import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
const local = existsSync(".local-runtime.json")
  ? JSON.parse(readFileSync(".local-runtime.json", "utf8"))
  : {};
const portIndex = process.argv.indexOf("--port");
const port =
  portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || "3000";
if (!/^\d{2,5}$/.test(port)) throw new Error("Invalid HTTP port");
const env = {
  ...process.env,
  ...(local.environment || {}),
  ASPNETCORE_ENVIRONMENT: process.env.ASPNETCORE_ENVIRONMENT || "Development",
};
let app;
if (local.prebuilt) {
  const binary = resolve(local.prebuilt);
  app = spawn(binary, ["--urls", `http://0.0.0.0:${port}`], {
    cwd: dirname(binary),
    stdio: "inherit",
    env,
  });
} else {
  const { dotnet } = await import("./build.mjs");
  app = spawn(
    dotnet,
    [
      "run",
      "--project",
      "src/Wardrobe.Api",
      "--no-build",
      "--no-launch-profile",
      "--urls",
      `http://0.0.0.0:${port}`,
    ],
    { stdio: "inherit", env },
  );
}
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => app.kill(signal));
app.on("exit", (code) => process.exit(code || 0));
