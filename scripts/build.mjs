import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, cpSync, mkdirSync } from "node:fs";
const local = existsSync(".local-runtime.json")
  ? JSON.parse(readFileSync(".local-runtime.json", "utf8"))
  : {};
export const dotnet = process.env.WARDROBE_DOTNET || local.dotnet || "dotnet";
export function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run("npm", ["--prefix", "client", "run", "build"]);
mkdirSync("src/Wardrobe.Api/wwwroot", { recursive: true });
cpSync("client/dist", "src/Wardrobe.Api/wwwroot", { recursive: true });
run(dotnet, [
  "build",
  "src/Wardrobe.Api/Wardrobe.Api.csproj",
  "-m:1",
  "-p:UseSharedCompilation=false",
]);
