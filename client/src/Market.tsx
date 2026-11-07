import type { ReactNode } from "react";
import type { Config } from "./store";
export function Community(_props: { config: Config; open: (node: ReactNode) => void; close: () => void }) {
  return <section className="page-heading"><div><span className="eyebrow">COURSE CHECKPOINT</span><h1>Sharing circle is next</h1><p>This feature is intentionally introduced in Stage 09. The API and navigation are available now; continue with the next learning branch to build this screen.</p></div></section>;
}
export function Reservations(_props: {} = {}) {
  return <section className="page-heading"><div><span className="eyebrow">COURSE CHECKPOINT</span><h1>Reservations are next</h1><p>This feature is intentionally introduced in Stage 09. The API and navigation are available now; continue with the next learning branch to build this screen.</p></div></section>;
}
