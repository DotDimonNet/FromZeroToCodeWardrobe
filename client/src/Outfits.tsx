import type { ReactNode } from "react";
import type { Config } from "./store";
export function Studio(_props: { config: Config }) {
  return <section className="page-heading"><div><span className="eyebrow">COURSE CHECKPOINT</span><h1>Outfit studio is next</h1><p>This feature is intentionally introduced in Stage 08. The API and navigation are available now; continue with the next learning branch to build this screen.</p></div></section>;
}
export function SavedLooks(_props: { open: (node: ReactNode) => void; close: () => void }) {
  return <section className="page-heading"><div><span className="eyebrow">COURSE CHECKPOINT</span><h1>Saved looks are next</h1><p>This feature is intentionally introduced in Stage 08. The API and navigation are available now; continue with the next learning branch to build this screen.</p></div></section>;
}
export function PublicOutfit(_props: { token: string }) {
  return <section className="page-heading"><div><span className="eyebrow">COURSE CHECKPOINT</span><h1>Public outfit sharing is next</h1><p>This feature is intentionally introduced in Stage 08. The API and navigation are available now; continue with the next learning branch to build this screen.</p></div></section>;
}
