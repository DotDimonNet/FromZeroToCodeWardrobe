import { useCallback, useEffect, useState, ReactNode } from "react";
import {
  Shirt,
  Sparkles,
  Heart,
  Repeat2,
  ShoppingBag,
  ArrowUpRight,
  Leaf,
  Menu,
  X,
  Check,
  Image,
} from "lucide-react";
import {
  actions,
  useAppDispatch,
  useAppSelector,
  useConfigQuery,
  useMeQuery,
  errorText,
} from "./store";
import { AccountGate, Profile } from "./Account";
import { WardrobePage } from "./Wardrobe";
import { Studio, SavedLooks, PublicOutfit } from "./Outfits";
import { Community, Reservations } from "./Market";
import { ErrorBox, Loading, Modal } from "./ui";
const navigation = [
  ["wardrobe", "My wardrobe", Shirt],
  ["studio", "Outfit studio", Sparkles],
  ["looks", "Saved looks", Heart],
  ["community", "Sharing circle", Repeat2],
  ["orders", "Reservations", ShoppingBag],
] as const;
function Credits({ close }: { close: () => void }) {
  const [credits, setCredits] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/image-credits.json")
      .then((r) => r.json())
      .then(setCredits)
      .catch(() =>
        setError(
          "Photo credits could not be loaded. They are included in the repository.",
        ),
      );
  }, []);
  return (
    <Modal title="Good images, openly shared." onClose={close}>
      <p>
        Sample photos are from Wikimedia Commons under CC0 1.0. They are resized
        and converted to WebP. Brands shown are not affiliated with this
        project.
      </p>
      <ErrorBox error={error} />
      <div className="credits-list">
        {credits.map((c) => (
          <div key={c.id}>
            <img src={`/images/${c.id}.webp`} alt="" />
            <div>
              <b>{c.id.replaceAll("-", " ")}</b>
              <p>
                {c.author} ·{" "}
                <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                  {c.license}
                </a>
              </p>
              <a href={c.source} target="_blank" rel="noreferrer">
                Original source
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
export default function App() {
  const { data: config, error: configError } = useConfigQuery();
  const { data: session, isLoading, error: sessionError } = useMeQuery();
  const dispatch = useAppDispatch();
  const { view, toast } = useAppSelector((s) => s.ui);
  const [modal, setModal] = useState<ReactNode>(null),
    [mobileMenu, setMobileMenu] = useState(false);
  const close = useCallback(() => setModal(null), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(actions.toast("")), 4200);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMobileMenu(false);
  }, [view]);
  const match = location.pathname.match(/^\/s\/([a-f0-9]{48})$/);
  if (match) return <PublicOutfit token={match[1]} />;
  if (configError || sessionError)
    return (
      <div className="startup-error">
        <a href="/" className="wordmark">
          thread
        </a>
        <ErrorBox error={errorText(configError || sessionError)} />
        <button className="button" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!config || isLoading) return <Loading />;
  if (!session?.user) return <AccountGate config={config} />;
  const user = session.user;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="wordmark"
            onClick={() => dispatch(actions.navigate("wardrobe"))}
          >
            thread<span>®</span>
          </button>
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
          >
            <X />
          </button>
        </div>
        <div className="sidebar-description">
          YOUR WARDROBE,
          <br />
          CONSIDERED.
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(([id, label, Icon], i) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => dispatch(actions.navigate(id))}
              aria-current={view === id ? "page" : undefined}
            >
              {i === 3 && <span className="nav-divider" />}
              <Icon size={19} strokeWidth={1.5} />
              <span>{label}</span>
              {view === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={18} />
            <p>
              Less, but better.
              <br />
              <span>Make every piece count.</span>
            </p>
          </div>
          <button
            className="credit-link"
            onClick={() => setModal(<Credits close={close} />)}
          >
            <Image size={14} />
            Photo credits
          </button>
          <button
            className="profile-button"
            onClick={() =>
              setModal(<Profile user={user} config={config} onClose={close} />)
            }
          >
            <span className="avatar">{user.displayName[0]}</span>
            <span>
              <b>{user.displayName}</b>
              <small>Your personal space</small>
            </span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="nav-scrim"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu />
            </button>
            <span>YOUR EVERYDAY, REIMAGINED</span>
          </div>
          <div>
            {config.demoMode && (
              <span className="demo-badge">
                <span />
                DEMO SPACE
              </span>
            )}
            <button
              className="top-profile"
              onClick={() =>
                setModal(
                  <Profile user={user} config={config} onClose={close} />,
                )
              }
            >
              Hello, {user.displayName.split(" ")[0]}
              <span className="avatar small">{user.displayName[0]}</span>
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {view === "wardrobe" ? (
            <WardrobePage config={config} open={setModal} close={close} />
          ) : view === "studio" ? (
            <Studio config={config} />
          ) : view === "looks" ? (
            <SavedLooks open={setModal} close={close} />
          ) : view === "community" ? (
            <Community config={config} open={setModal} close={close} />
          ) : (
            <Reservations />
          )}
          <footer className="site-footer">
            <span>thread® · a considered wardrobe</span>
            <span>KEEP THE GOOD THINGS GOING.</span>
          </footer>
        </main>
      </div>
      {modal}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => dispatch(actions.toast(""))}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
