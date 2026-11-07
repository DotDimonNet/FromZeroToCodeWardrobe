import { ReactNode, useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Heart,
  ArrowUpRight,
  Sparkles,
  X,
  Shirt,
  Footprints,
  Pencil,
  Trash2,
  Leaf,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  actions,
  Config,
  Garment,
  defaultFilters,
  useAppDispatch,
  useAppSelector,
  useGarmentsQuery,
  useOutfitsQuery,
  errorText,
} from "./store";
import {
  Button,
  ErrorBox,
  Loading,
  Modal,
  Select,
  Photo,
  Empty,
  useTask,
} from "./ui";
export type OpenModal = (node: ReactNode) => void;
export function WardrobePage({
  config,
  open,
  close,
}: {
  config: Config;
  open: OpenModal;
  close: () => void;
}) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.ui.filters);
  const { data: pieces = [], isLoading, error } = useGarmentsQuery(filters);
  const { data: all = [] } = useGarmentsQuery(defaultFilters);
  const { data: outfits = [] } = useOutfitsQuery();
  const [expanded, setExpanded] = useState(false);
  const task = useTask();
  const countFilters = Object.entries(filters).filter(
    ([k, v]) =>
      !["sort", "search", "category"].includes(k) && v !== "" && v !== false,
  ).length;
  const edit = (g?: Garment) =>
    open(<GarmentForm config={config} garment={g} onClose={close} />);
  return (
    <>
      <section className="wardrobe-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> YOUR STYLE. YOUR POSSIBILITIES.
          </span>
          <h1>
            Your wardrobe.
            <br />
            <span>Reimagined.</span>
          </h1>
          <p>
            Less “nothing to wear.” More looks you love. Rediscover your pieces
            and put something great together.
          </p>
          <Button onClick={() => dispatch(actions.navigate("studio"))}>
            <Sparkles size={17} />
            Build an outfit
            <ArrowUpRight size={17} />
          </Button>
          <div className="hero-stats">
            <div>
              <b>{all.length.toString().padStart(2, "0")}</b>
              <span>wardrobe pieces</span>
            </div>
            <div>
              <b>{outfits.length.toString().padStart(2, "0")}</b>
              <span>saved looks</span>
            </div>
            <div className="hero-philosophy">
              <Leaf size={19} />
              <span>
                Wear more.
                <br />
                Waste less.
              </span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-caption">
            <span>THE EVERYDAY EDIT</span>
            <span>MADE FOR EVERY DAY</span>
          </div>
          <div className="art-main">
            <Photo imageKey="denim-shirt" alt="" />
            <span>
              <b>Denim, on repeat.</b>
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="art-small">
            <Photo imageKey="retro-shoes" alt="" />
            <span>
              <b>Your everyday pair</b>
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="art-label">
            <Sparkles size={16} />
            <span>Good pieces. New combinations.</span>
          </div>
        </div>
      </section>
      <section className="closet-section">
        <div className="section-heading">
          <div>
            <h2>
              Your wardrobe <span className="count">{all.length}</span>
            </h2>
            <p>All your favorites. One thoughtfully organized space.</p>
          </div>
          <Button onClick={() => edit()}>
            <Plus size={17} />
            Add a piece
          </Button>
        </div>
        <div className="wardrobe-toolbar">
          <div className="category-tabs">
            {["", "Top", "Bottom", "Shoes", "Outerwear", "Accessory"].map(
              (c) => (
                <button
                  key={c}
                  className={filters.category === c ? "active" : ""}
                  aria-pressed={filters.category === c}
                  onClick={() => dispatch(actions.filter({ category: c }))}
                >
                  {
                    (
                      {
                        "": "All pieces",
                        Top: "Tops",
                        Bottom: "Bottoms",
                        Shoes: "Shoes",
                        Outerwear: "Layers",
                        Accessory: "Accessories",
                      } as Record<string, string>
                    )[c]
                  }
                </button>
              ),
            )}
          </div>
          <div className="search-controls">
            <label className="search-box">
              <Search size={17} />
              <input
                aria-label="Search wardrobe"
                value={filters.search}
                onChange={(e) =>
                  dispatch(actions.filter({ search: e.target.value }))
                }
                placeholder="Search your wardrobe…"
              />
            </label>
            <button
              className={`filter-toggle ${expanded ? "active" : ""}`}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls="wardrobe-filters"
            >
              <SlidersHorizontal size={17} />
              Filters{countFilters > 0 && <span>{countFilters}</span>}
            </button>
          </div>
        </div>
        <div className="catalog-layout">
          <aside
            id="wardrobe-filters"
            className={`filters-panel ${expanded ? "is-expanded" : ""}`}
            aria-label="Wardrobe filters"
          >
            <div className="filter-heading">
              <h3>
                <SlidersHorizontal size={17} /> Filters
              </h3>
              <button onClick={() => dispatch(actions.resetFilters())}>
                Reset
              </button>
            </div>
            <fieldset className="color-filter">
              <legend>Color palette</legend>
              <div className="color-options">
                {Object.entries(config.colors).map(([color, hex]) => (
                  <button
                    key={color}
                    className={filters.color === color ? "selected" : ""}
                    aria-label={`Filter by ${color}`}
                    aria-pressed={filters.color === color}
                    title={color}
                    onClick={() =>
                      dispatch(
                        actions.filter({
                          color: filters.color === color ? "" : color,
                        }),
                      )
                    }
                  >
                    <span style={{ background: hex }} />
                    {filters.color === color && <Check size={12} />}
                  </button>
                ))}
              </div>
              <p>{filters.color || "Every shade of you"}</p>
            </fieldset>
            <Select
              label="Season"
              value={filters.season}
              options={config.seasons.filter((s) => s !== "All")}
              placeholder="All seasons"
              onChange={(season) => dispatch(actions.filter({ season }))}
            />
            <Select
              label="Style"
              value={filters.style}
              options={config.styles}
              placeholder="All styles"
              onChange={(style) => dispatch(actions.filter({ style }))}
            />
            <Select
              label="Era / period"
              value={filters.era}
              options={config.eras}
              placeholder="All eras"
              onChange={(era) => dispatch(actions.filter({ era }))}
            />
            <button
              className={`chip favorite-chip ${filters.favorites ? "selected" : ""}`}
              aria-pressed={filters.favorites}
              onClick={() =>
                dispatch(actions.filter({ favorites: !filters.favorites }))
              }
            >
              <Heart size={15} />
              Favorites only
            </button>
            <div className="filter-tip">
              <Sparkles size={19} />
              <p>A new look might already be in your wardrobe.</p>
              <button onClick={() => dispatch(actions.navigate("studio"))}>
                Try outfit studio <ArrowRight size={15} />
              </button>
            </div>
          </aside>
          <div className="catalog-results">
            <div className="results-bar">
              <span aria-live="polite">
                <b>{pieces.length}</b>{" "}
                {pieces.length === 1 ? "piece" : "pieces"}
                {(countFilters > 0 || filters.category || filters.search) && (
                  <button onClick={() => dispatch(actions.resetFilters())}>
                    Clear filters
                    <X size={12} />
                  </button>
                )}
              </span>
              <label>
                Sort by{" "}
                <select
                  aria-label="Sort wardrobe"
                  value={filters.sort}
                  onChange={(e) =>
                    dispatch(actions.filter({ sort: e.target.value }))
                  }
                >
                  <option value="newest">Recently added</option>
                  <option value="name">Name A–Z</option>
                  <option value="color">Color</option>
                </select>
              </label>
            </div>
            <ErrorBox error={error ? errorText(error) : task.error} />
            {isLoading ? (
              <Loading />
            ) : pieces.length === 0 ? (
              <Empty
                title="Room for something good"
                action={
                  <Button secondary onClick={() => edit()}>
                    <Plus size={16} />
                    Add your first piece
                  </Button>
                }
              >
                Add a piece, or loosen your filters to rediscover your wardrobe.
              </Empty>
            ) : (
              <div className="garment-grid">
                {pieces.map((g) => (
                  <article
                    className={`garment-card ${!g.isAvailable ? "unavailable" : ""}`}
                    key={g.id}
                  >
                    <div className="garment-image">
                      <button
                        className="image-button"
                        onClick={() => edit(g)}
                        aria-label={`Edit ${g.name}`}
                      >
                        <Photo imageKey={g.imageKey} alt={g.name} />
                      </button>
                      <span className="photo-tag">
                        {g.category === "Top"
                          ? "ESSENTIAL"
                          : g.category === "Shoes"
                            ? "ON REPEAT"
                            : g.category === "Outerwear"
                              ? "LAYER UP"
                              : "EVERYDAY"}
                      </span>
                      <button
                        className={`favorite ${g.isFavorite ? "on" : ""}`}
                        aria-label={`${g.isFavorite ? "Unfavorite" : "Favorite"} ${g.name}`}
                        aria-pressed={g.isFavorite}
                        disabled={task.busy}
                        onClick={() =>
                          task.run({
                            url: `garments/${g.id}`,
                            method: "PUT",
                            body: { ...g, isFavorite: !g.isFavorite },
                          })
                        }
                      >
                        <Heart
                          size={17}
                          fill={g.isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                      {!g.isAvailable && (
                        <span className="unavailable-label">
                          Away from wardrobe
                        </span>
                      )}
                    </div>
                    <div className="garment-info">
                      <div>
                        <h3>
                          <button onClick={() => edit(g)}>{g.name}</button>
                        </h3>
                        <p>
                          {g.style}
                          <span>·</span>
                          {g.season === "All" ? "All seasons" : g.season}
                        </p>
                      </div>
                      <span
                        title={g.color}
                        aria-label={g.color}
                        className="color-dot"
                        style={{ background: config.colors[g.color] }}
                      />
                    </div>
                    <div className="garment-card-bottom">
                      <span>
                        {g.category} <span> / </span> {g.era}
                      </span>
                      <button
                        onClick={() => edit(g)}
                        aria-label={`View details for ${g.name}`}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="bottom-note">
        <Leaf size={16} />
        <p>The most sustainable outfit? The one you already own.</p>
        <span>MAKE IT A HABIT.</span>
      </div>
    </>
  );
}
export function GarmentForm({
  config,
  garment,
  onClose,
}: {
  config: Config;
  garment?: Garment;
  onClose: () => void;
}) {
  const [input, setInput] = useState<Omit<Garment, "id">>(
    garment || {
      name: "",
      category: "Top",
      color: "White",
      season: "All",
      style: "Casual",
      era: "Timeless",
      imageKey: "white-tee",
      isAvailable: true,
      isFavorite: false,
    },
  );
  const [deleting, setDeleting] = useState(false);
  const task = useTask();
  const set = (k: string, v: unknown) => setInput((x) => ({ ...x, [k]: v }));
  return (
    <Modal
      title={garment ? "A piece of your style" : "Add something you love"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          task.run(
            {
              url: garment ? `garments/${garment.id}` : "garments",
              method: garment ? "PUT" : "POST",
              body: input,
            },
            onClose,
            garment
              ? "Piece updated."
              : "A new piece, a little more possibility.",
          );
        }}
      >
        <ErrorBox error={task.error} />
        <div className="garment-form-layout">
          <div>
            <div className="form-main-photo">
              <Photo
                imageKey={input.imageKey}
                alt={input.name || "Selected garment photo"}
              />
            </div>
            <span className="field-label">Choose a sample photo</span>
            <div className="photo-picker">
              {config.images.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={input.imageKey === key ? "selected" : ""}
                  aria-label={`Choose ${key.replaceAll("-", " ")}`}
                  aria-pressed={input.imageKey === key}
                  onClick={() => set("imageKey", key)}
                >
                  <Photo imageKey={key} alt="" />
                </button>
              ))}
            </div>
            <p className="muted tiny">
              Openly licensed sample photography. Personal uploads are outside
              this MVP.
            </p>
          </div>
          <div>
            <label className="field">
              <span>Piece name</span>
              <input
                autoComplete="off"
                required
                maxLength={80}
                placeholder="My favorite white tee"
                value={input.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <div className="form-grid">
              <Select
                label="Category"
                value={input.category}
                options={config.categories}
                onChange={(v) => set("category", v)}
              />
              <Select
                label="Main color"
                value={input.color}
                options={Object.keys(config.colors)}
                onChange={(v) => set("color", v)}
              />
              <Select
                label="Season"
                value={input.season}
                options={config.seasons}
                onChange={(v) => set("season", v)}
              />
              <Select
                label="Style"
                value={input.style}
                options={config.styles}
                onChange={(v) => set("style", v)}
              />
              <Select
                label="Era / period"
                value={input.era}
                options={config.eras}
                onChange={(v) => set("era", v)}
              />
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={input.isAvailable}
                onChange={(e) => set("isAvailable", e.target.checked)}
              />
              Available for outfits
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={input.isFavorite}
                onChange={(e) => set("isFavorite", e.target.checked)}
              />
              One of my favorites
            </label>
            <p className="muted tiny">
              Mark pieces unavailable while they’re in the wash, lent out, or
              stored away.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          {garment ? (
            <button
              type="button"
              className="text-link danger"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={16} />
              Delete piece
            </button>
          ) : (
            <span />
          )}
          <Button busy={task.busy}>
            <Plus size={16} />
            {garment ? "Save changes" : "Add to wardrobe"}
          </Button>
        </div>
      </form>
      {deleting && (
        <div className="confirm-strip">
          <span>
            Delete this piece permanently? Saved outfits using it must be
            removed first.
          </span>
          <Button secondary onClick={() => setDeleting(false)}>
            Keep it
          </Button>
          <Button
            busy={task.busy}
            onClick={() =>
              task.run(
                { url: `garments/${garment!.id}`, method: "DELETE" },
                onClose,
                "Piece deleted.",
              )
            }
          >
            Delete
          </Button>
        </div>
      )}
    </Modal>
  );
}
