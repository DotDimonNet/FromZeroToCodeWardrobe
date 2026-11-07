import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";
import App from "../client/src/App";
import { AccountGate, Profile } from "../client/src/Account";
import { GarmentForm } from "../client/src/Wardrobe";
import { store, api, actions, defaultFilters } from "../client/src/store";

const source = JSON.parse(
  readFileSync(process.argv[2] || "artifacts/demo-data.json", "utf8"),
);
const output = resolve(process.argv[3] || "artifacts/walkthrough");
mkdirSync(output, { recursive: true });
cpSync("client/dist/assets", output + "/assets", { recursive: true });
cpSync("client/public/images", output + "/images", { recursive: true });
const cssUrl = readFileSync("client/dist/index.html", "utf8").match(
  /href="([^"]+\.css)"/,
)?.[1];
if (!cssUrl)
  throw new Error("Build the client before rendering the walkthrough.");
Object.assign(globalThis, { location: new URL("http://localhost/") });
store.dispatch(
  api.util.upsertQueryEntries([
    { endpointName: "config", arg: undefined, value: source.config },
    { endpointName: "me", arg: undefined, value: source.session },
    { endpointName: "garments", arg: defaultFilters, value: source.garments },
    { endpointName: "outfits", arg: undefined, value: source.outfits },
    { endpointName: "market", arg: undefined, value: source.market },
    { endpointName: "orders", arg: undefined, value: source.orders },
  ]),
);
const wrap = (child: React.ReactNode) => (
  <Provider store={store}>{child}</Provider>
);
function save(file: string, node: React.ReactNode) {
  const html = renderToStaticMarkup(wrap(node));
  writeFileSync(
    `${output}/${file}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thread · visual walkthrough</title><link rel="stylesheet" href="${cssUrl}"><style>.walkthrough-label{position:fixed;bottom:0;left:0;right:0;z-index:180;background:#122346;color:#e2ebff;text-align:center;font:9px Arial;letter-spacing:1px;padding:7px;pointer-events:none}@media(max-width:950px){.walkthrough-label{position:static;font-size:8px;letter-spacing:.5px;padding-bottom:90px}}</style></head><body>${html}<div class="walkthrough-label">RENDERED REACT SCREENS · REAL API-EXPORTED DEMO DATA · STATIC WALKTHROUGH</div></body></html>`,
  );
}
save("01-sign-in", <AccountGate config={source.config} />);
for (const [view, file] of [
  ["wardrobe", "02-wardrobe"],
  ["studio", "04-studio"],
  ["looks", "05-saved-looks"],
  ["community", "06-community"],
  ["orders", "07-reservations"],
]) {
  store.dispatch(actions.navigate(view));
  save(file, <App />);
}
store.dispatch(actions.navigate("wardrobe"));
save(
  "03-add-piece",
  <>
    <App />
    <GarmentForm
      config={source.config}
      garment={source.garments[0]}
      onClose={() => {}}
    />
  </>,
);
save(
  "08-profile",
  <>
    <App />
    <Profile
      user={source.session.user}
      config={source.config}
      onClose={() => {}}
    />
  </>,
);
cpSync(output + "/02-wardrobe.html", output + "/index.html");
console.log(`Rendered eight visual walkthrough screens at ${output}`);
process.exit(0);
