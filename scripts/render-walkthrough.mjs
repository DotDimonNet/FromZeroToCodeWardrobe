import { build } from "../client/node_modules/esbuild/lib/main.js";
import { mkdirSync } from "node:fs";
mkdirSync("artifacts", { recursive: true });
await build({
  entryPoints: ["scripts/walkthrough-entry.tsx"],
  outfile: "artifacts/render-walkthrough.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  nodePaths: ["client/node_modules"],
  define: { "process.env.NODE_ENV": '"production"' },
});
console.log(
  "Run: node artifacts/render-walkthrough.cjs artifacts/demo-data.json OUTPUT_DIRECTORY",
);
