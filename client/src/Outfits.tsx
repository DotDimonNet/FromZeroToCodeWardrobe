import { useState } from "react";
import {
  Sparkles,
  ArrowUpRight,
  Heart,
  Share2,
  Copy,
  Check,
  Link2Off,
  Trash2,
  RefreshCw,
  Shirt,
} from "lucide-react";
import {
  Config,
  Outfit,
  Suggestion,
  actions,
  useAppDispatch,
  useAppSelector,
  useOutfitsQuery,
  useSharedQuery,
  errorText,
} from "./store";
import {
  Brand,
  Button,
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHeading,
  Photo,
  Select,
  useTask,
} from "./ui";
import { OpenModal } from "./Wardrobe";
export function Studio({ config }: { config: Config }) {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((s) => s.ui.preferences);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generated, setGenerated] = useState(false);
  const [names, setNames] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState<number[]>([]);
  const task = useTask();
  const [applied, setApplied] = useState(preferences);
  return (
    <>
      <PageHeading
        eyebrow="A FRESH WAY TO WEAR IT"
        title="Your outfit studio."
        description="A few thoughtful choices. A look that feels like you."
      />
      <div className="studio-layout">
        <aside className="studio-controls">
          <span className="step-label">01 / SET THE MOOD</span>
          <h2>What’s the occasion?</h2>
          <p>
            We’ll start with one top, one bottom and a pair of shoes from your
            wardrobe.
          </p>
          <Select
            label="Season"
            options={config.seasons}
            value={preferences.season}
            onChange={(season) => dispatch(actions.preferences({ season }))}
          />
          <Select
            label="Personal style"
            options={["Any", ...config.styles]}
            value={preferences.style}
            onChange={(style) => dispatch(actions.preferences({ style }))}
          />
          <Select
            label="Era / period"
            options={["Any", ...config.eras]}
            value={preferences.era}
            onChange={(era) => dispatch(actions.preferences({ era }))}
          />
          <Select
            label="Color harmony"
            options={config.palettes}
            value={preferences.palette}
            onChange={(palette) => dispatch(actions.preferences({ palette }))}
          />
          <Button
            busy={task.busy}
            className="full-width"
            onClick={() =>
              task.run(
                { url: "outfits/generate", method: "POST", body: preferences },
                (data) => {
                  setSuggestions(data);
                  setGenerated(true);
                  setSaved([]);
                  setNames({});
                  setApplied({ ...preferences });
                },
              )
            }
          >
            <Sparkles size={17} />
            {generated ? "Find fresh combinations" : "Generate my outfits"}
          </Button>
          <p className="muted tiny">
            Only available pieces are used. Favorites and your chosen style edit
            help rank the results.
          </p>
        </aside>
        <div className="studio-results">
          <div className="section-heading compact">
            <div>
              <span className="step-label">02 / A LITTLE INSPIRATION</span>
              <h2>The style edit</h2>
            </div>
            <span className="curated-label">EDITOR-CURATED</span>
          </div>
          <div className="trend-grid">
            {config.trends.map((t, i) => (
              <button
                key={t.id}
                className={`trend-card trend-${i} ${preferences.trendId === t.id ? "selected" : ""}`}
                aria-pressed={preferences.trendId === t.id}
                onClick={() =>
                  dispatch(
                    actions.preferences({
                      trendId: preferences.trendId === t.id ? null : t.id,
                    }),
                  )
                }
              >
                <div className="trend-swatches">
                  {t.colors.map((c) => (
                    <span key={c} style={{ background: config.colors[c] }} />
                  ))}
                </div>
                <span className="eyebrow">0{i + 1}</span>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <span className="trend-action">
                  {preferences.trendId === t.id ? "Selected" : "Try this mood"}
                  {preferences.trendId === t.id ? (
                    <Check size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="curation-note">
            Style inspiration, curated for this demo. These are not live trend
            forecasts.
          </p>
          <div className="section-heading compact suggestion-heading">
            <div>
              <span className="step-label">03 / MAKE IT YOURS</span>
              <h2>
                {generated
                  ? "Your next good outfit"
                  : "Possibilities, waiting to happen"}
              </h2>
            </div>
            {generated && (
              <span className="muted tiny">
                {suggestions.length} suggestions
              </span>
            )}
          </div>
          <ErrorBox error={task.error} />
          {!generated ? (
            <div className="studio-placeholder">
              <div className="outline-trio">
                <Shirt size={56} strokeWidth={0.8} />
                <span>+</span>
                <img
                  src="/images/dark-jeans.webp"
                  alt="Denim outfit inspiration"
                />
                <span>+</span>
                <img
                  src="/images/retro-shoes.webp"
                  alt="Trainer outfit inspiration"
                />
              </div>
              <h3>There’s a good outfit in there.</h3>
              <p>
                Choose a season and color palette, then let’s put it together.
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <Empty title="Let’s loosen things up">
              No complete outfit matches these preferences. Try “Any” style or
              palette, or add an available top, bottom and shoes.
            </Empty>
          ) : (
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <article
                  key={`${s.items.map((g) => g.id).join("")}-${i}`}
                  className="suggestion-card"
                >
                  <div className="look-topline">
                    <span className="eyebrow">LOOK 0{i + 1}</span>
                    <span className="match-score">
                      <Sparkles size={13} />
                      {s.score} / 100 match
                    </span>
                  </div>
                  <div className="outfit-trio">
                    {s.items.map((g) => (
                      <div key={g.id}>
                        <Photo imageKey={g.imageKey} alt={g.name} />
                        <span>{g.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="reasons">
                    {s.reasons.map((r) => (
                      <span key={r}>
                        <Check size={13} />
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="save-look">
                    <input
                      aria-label={`Name for look ${i + 1}`}
                      maxLength={80}
                      value={
                        names[i] ??
                        `My ${applied.season === "All" ? "everyday" : applied.season.toLowerCase()} edit ${i + 1}`
                      }
                      onChange={(e) =>
                        setNames({ ...names, [i]: e.target.value })
                      }
                    />
                    <Button
                      secondary
                      busy={task.busy}
                      disabled={saved.includes(i)}
                      onClick={() =>
                        task.run(
                          {
                            url: "outfits",
                            method: "POST",
                            body: {
                              name:
                                names[i] ??
                                `My ${applied.season === "All" ? "everyday" : applied.season.toLowerCase()} edit ${i + 1}`,
                              garmentIds: s.items.map((g) => g.id),
                              preferences: applied,
                            },
                          },
                          () => setSaved([...saved, i]),
                          "Outfit saved to your looks.",
                        )
                      }
                    >
                      <Heart size={15} />
                      {saved.includes(i) ? "Saved" : "Save look"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="explain-note">
        <Sparkles size={18} />
        <p>
          <b>Style with a reason.</b> Suggestions use color families, season
          compatibility and your own preferences. The match score is a simple
          ranking, not a prediction of what you’ll like.
        </p>
      </div>
    </>
  );
}
export function SavedLooks({
  open,
  close,
}: {
  open: OpenModal;
  close: () => void;
}) {
  const { data: looks = [], isLoading, error } = useOutfitsQuery();
  const task = useTask();
  const dispatch = useAppDispatch();
  return (
    <>
      <PageHeading
        eyebrow="GOOD LOOKS, ON REPEAT"
        title="Your saved looks."
        description="A little collection of outfits that feel like you."
        action={
          <Button onClick={() => dispatch(actions.navigate("studio"))}>
            <Sparkles size={17} />
            Create a look
          </Button>
        }
      />
      <ErrorBox error={error ? errorText(error) : task.error} />
      {isLoading ? (
        <Loading />
      ) : looks.length === 0 ? (
        <Empty
          title="Your best combinations belong here"
          action={
            <Button
              secondary
              onClick={() => dispatch(actions.navigate("studio"))}
            >
              Open outfit studio
              <ArrowUpRight size={16} />
            </Button>
          }
        >
          Generate a look and save it for an easier morning.
        </Empty>
      ) : (
        <div className="saved-grid">
          {looks.map((o) => (
            <article className="saved-card" key={o.id}>
              <div className="look-topline">
                <span className="eyebrow">
                  {o.season === "All" ? "EVERY SEASON" : o.season.toUpperCase()}
                </span>
                {o.shareToken && <span className="status-pill">Shared</span>}
              </div>
              <div className="saved-trio">
                {o.items.map((g) => (
                  <Photo key={g.id} imageKey={g.imageKey} alt={g.name} />
                ))}
              </div>
              <h2>{o.name}</h2>
              <p>{o.items.map((g) => g.name).join(" · ")}</p>
              <div className="saved-actions">
                <Button
                  secondary
                  onClick={() =>
                    open(<ShareOutfit outfit={o} onClose={close} />)
                  }
                >
                  <Share2 size={15} />
                  Share outfit
                </Button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${o.name}`}
                  onClick={() =>
                    open(
                      <Modal title="Let this look go?" onClose={close}>
                        <p>
                          Delete “{o.name}”? Its share link will stop working.
                          Your clothes stay in your wardrobe.
                        </p>
                        <DeleteLook id={o.id} close={close} />
                      </Modal>,
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function DeleteLook({ id, close }: { id: string; close: () => void }) {
  const task = useTask();
  return (
    <>
      <ErrorBox error={task.error} />
      <div className="modal-footer">
        <Button secondary onClick={close}>
          Keep look
        </Button>
        <Button
          busy={task.busy}
          onClick={() =>
            task.run(
              { url: `outfits/${id}`, method: "DELETE" },
              close,
              "Outfit deleted.",
            )
          }
        >
          Delete look
        </Button>
      </div>
    </>
  );
}
function ShareOutfit({
  outfit,
  onClose,
}: {
  outfit: Outfit;
  onClose: () => void;
}) {
  const [look, setLook] = useState(outfit),
    [copied, setCopied] = useState(false);
  const task = useTask();
  const url = look.shareToken ? `${location.origin}/s/${look.shareToken}` : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      task.setError(
        "Copy is unavailable in this browser. Select the link below and copy it manually.",
      );
    }
  }
  return (
    <Modal title="Good style is worth sharing." onClose={onClose}>
      <div className="shared-mini">
        {look.items.map((g) => (
          <Photo key={g.id} imageKey={g.imageKey} alt={g.name} />
        ))}
      </div>
      <h3>{look.name}</h3>
      <p>
        Anyone with the link can see this outfit and its pieces. Your email and
        other wardrobe items stay private.
      </p>
      <ErrorBox error={task.error} />
      {url ? (
        <>
          <label className="field">
            <span>Public outfit link</span>
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className="share-buttons">
            <Button secondary onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}Copy link
            </Button>
            {!!navigator.share && (
              <Button
                secondary
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: look.name,
                      text: "A look from my Thread wardrobe",
                      url,
                    });
                  } catch (e) {
                    if ((e as Error).name !== "AbortError")
                      task.setError(
                        "Sharing is unavailable. You can copy the link instead.",
                      );
                  }
                }}
              >
                <Share2 size={16} />
                Share…
              </Button>
            )}
            <a
              className="button secondary"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
              <ArrowUpRight size={15} />
            </a>
            <a
              className="button secondary"
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(location.origin + "/images/" + look.items[0].imageKey + ".webp")}&description=${encodeURIComponent(look.name)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Pinterest
              <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            className="text-link danger"
            disabled={task.busy}
            onClick={() =>
              task.run(
                {
                  url: `outfits/${look.id}/sharing`,
                  method: "PUT",
                  body: { enabled: false },
                },
                setLook,
                "Share link revoked.",
              )
            }
          >
            <Link2Off size={15} />
            Turn off sharing
          </button>
        </>
      ) : (
        <Button
          busy={task.busy}
          onClick={() =>
            task.run(
              {
                url: `outfits/${look.id}/sharing`,
                method: "PUT",
                body: { enabled: true },
              },
              setLook,
            )
          }
        >
          <Share2 size={16} />
          Create share link
        </Button>
      )}
    </Modal>
  );
}
export function PublicOutfit({ token }: { token: string }) {
  const { data: look, isLoading, error } = useSharedQuery(token);
  return (
    <div className="public-page">
      <a className="wordmark" href="/">
        <Brand />
      </a>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <Empty title="This look is no longer shared">
          Its owner may have turned sharing off.
          <br />
          <a href="/">Explore Thread</a>
        </Empty>
      ) : (
        look && (
          <>
            <span className="eyebrow">A LITTLE OUTFIT INSPIRATION</span>
            <h1>{look.name}</h1>
            <p>Put together with intention. Shared with you.</p>
            <div className="public-pieces">
              {look.items.map((g) => (
                <article key={g.id}>
                  <Photo imageKey={g.imageKey} alt={g.name} />
                  <h3>{g.name}</h3>
                  <p>
                    {g.color} · {g.style}
                  </p>
                </article>
              ))}
            </div>
            <a href="/" className="button">
              Find your own good outfit
              <ArrowUpRight size={16} />
            </a>
          </>
        )
      )}
    </div>
  );
}
