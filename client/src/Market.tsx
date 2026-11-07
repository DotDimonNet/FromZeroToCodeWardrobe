import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  MapPin,
  Leaf,
  Repeat2,
  Gift,
  ShoppingBag,
  Check,
  Clock3,
} from "lucide-react";
import {
  Config,
  Listing,
  Order,
  money,
  errorText,
  useMarketQuery,
  useOrdersQuery,
  actions,
  useAppDispatch,
} from "./store";
import {
  Button,
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHeading,
  Photo,
  Select,
  useTask,
  Success,
} from "./ui";
import { OpenModal } from "./Wardrobe";
export function Community({
  config,
  open,
  close,
}: {
  config: Config;
  open: OpenModal;
  close: () => void;
}) {
  const { data: listings = [], isLoading, error } = useMarketQuery();
  const [mode, setMode] = useState(""),
    [category, setCategory] = useState(""),
    [search, setSearch] = useState(""),
    [mine, setMine] = useState(false);
  const dispatch = useAppDispatch();
  const filtered = listings.filter(
    (l) =>
      (mine ? l.isMine : l.available) &&
      (!mode || l.mode === mode) &&
      (!category || l.category === category) &&
      (!search ||
        `${l.title} ${l.city}`.toLowerCase().includes(search.toLowerCase())),
  );
  return (
    <>
      <PageHeading
        eyebrow="GOOD PIECES DESERVE ANOTHER CHAPTER"
        title="The sharing circle."
        description="Buy a favorite. Borrow a look. Pass something good along."
        action={
          <Button
            onClick={() =>
              open(<ListingForm config={config} onClose={close} />)
            }
          >
            <Plus size={17} />
            Share a piece
          </Button>
        }
      />
      <div className="community-banner">
        <div>
          <Leaf size={25} />
          <h2>
            A smaller footprint.
            <br />A bigger circle.
          </h2>
        </div>
        <p>
          This is a community of second chances.
          <br />
          Reserve a piece, then arrange a local handover.
          <br />
          <b>No online payments are taken.</b>
        </p>
        <span className="circle-graphic" aria-hidden="true">
          <Repeat2 size={56} strokeWidth={1} />
        </span>
      </div>
      <div className="community-filters">
        <div className="category-tabs">
          {[
            ["", "Everything"],
            ["Sell", "For sale"],
            ["Lend", "To borrow"],
            ["Giveaway", "Free to love"],
          ].map(([v, label]) => (
            <button
              key={v}
              className={mode === v ? "active" : ""}
              onClick={() => setMode(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-box">
          <input
            aria-label="Search community by title or city"
            placeholder="Search pieces or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="market-options">
        <Select
          label="Category"
          options={config.categories}
          value={category}
          placeholder="All categories"
          onChange={setCategory}
        />
        <label className="check-field">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />
          My listings, including reserved
        </label>
        <button
          className="text-link"
          onClick={() => dispatch(actions.navigate("orders"))}
        >
          View reservations
          <ArrowUpRight size={16} />
        </button>
      </div>
      <ErrorBox error={error ? errorText(error) : ""} />
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="A little room in the circle">
          Try another filter, or share a piece from your wardrobe.
        </Empty>
      ) : (
        <div className="market-grid">
          {filtered.map((l) => (
            <article className="market-card" key={l.id}>
              <button
                className="market-image"
                onClick={() =>
                  open(<ListingDetail listing={l} onClose={close} />)
                }
              >
                <Photo imageKey={l.imageKey} alt={l.title} />
                <span className={`mode-badge ${l.mode.toLowerCase()}`}>
                  {l.mode === "Sell" ? (
                    <ShoppingBag size={12} />
                  ) : l.mode === "Lend" ? (
                    <Repeat2 size={12} />
                  ) : (
                    <Gift size={12} />
                  )}{" "}
                  {l.mode === "Sell"
                    ? "FOR SALE"
                    : l.mode === "Lend"
                      ? "TO BORROW"
                      : "FREE TO LOVE"}
                </span>
                {!l.available && (
                  <span className="unavailable-label">
                    Reserved / withdrawn
                  </span>
                )}
              </button>
              <div className="market-card-info">
                <div className="market-title">
                  <h3>
                    <button
                      onClick={() =>
                        open(<ListingDetail listing={l} onClose={close} />)
                      }
                    >
                      {l.title}
                    </button>
                  </h3>
                  <b>{l.priceCents ? money(l.priceCents) : "Free"}</b>
                </div>
                <p>
                  {l.size} · {l.condition}
                </p>
                <div className="seller-line">
                  <span>
                    <span className="mini-avatar">{l.sellerName[0]}</span>
                    {l.sellerName}
                    {l.isMine ? " · You" : ""}
                  </span>
                  <span>
                    <MapPin size={12} />
                    {l.city}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function ListingDetail({
  listing: l,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const [note, setNote] = useState(""),
    [done, setDone] = useState(false);
  const task = useTask();
  const dispatch = useAppDispatch();
  return (
    <Modal title={l.title} onClose={onClose}>
      <div className="listing-detail-photo">
        <Photo imageKey={l.imageKey} alt={l.title} />
      </div>
      {done ? (
        <>
          <Success>
            Your request is with {l.sellerName}. Track it in Reservations.
          </Success>
          <Button
            onClick={() => {
              onClose();
              dispatch(actions.navigate("orders"));
            }}
          >
            View reservation
            <ArrowUpRight size={16} />
          </Button>
        </>
      ) : (
        <>
          <div className="listing-price">
            <b>{l.priceCents ? money(l.priceCents) : "Free"}</b>
            <span>
              {l.mode === "Lend"
                ? "Borrowing fee for the agreed period"
                : l.mode === "Giveaway"
                  ? "A gift to a new wardrobe"
                  : "Pay directly at handover"}
            </span>
          </div>
          <p>{l.description}</p>
          <div className="detail-tags">
            <span>Size {l.size}</span>
            <span>{l.condition}</span>
            <span>{l.category}</span>
          </div>
          <p className="seller-details">
            <MapPin size={16} />
            {l.city} · Shared by {l.sellerName}
          </p>
          <ErrorBox error={task.error} />
          {l.isMine ? (
            <Button
              secondary
              disabled={!l.available}
              busy={task.busy}
              onClick={() =>
                task.run(
                  { url: `market/${l.id}`, method: "DELETE" },
                  onClose,
                  "Listing withdrawn.",
                )
              }
            >
              Withdraw listing
            </Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                task.run(
                  {
                    url: `market/${l.id}/reserve`,
                    method: "POST",
                    body: { note },
                  },
                  () => setDone(true),
                );
              }}
            >
              <label className="field">
                <span>
                  Message to {l.sellerName} <small>(optional)</small>
                </span>
                <textarea
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Suggest a public pickup location and a time that works for you."
                />
              </label>
              <div className="reservation-note">
                <Clock3 size={18} />
                <p>
                  Request a reservation. The owner confirms it before you
                  arrange handover. No payment is collected here.
                </p>
              </div>
              <Button
                className="full-width"
                disabled={!l.available}
                busy={task.busy}
              >
                {l.available ? "Request this piece" : "Already reserved"}
                <ArrowUpRight size={17} />
              </Button>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
function ListingForm({
  config,
  onClose,
}: {
  config: Config;
  onClose: () => void;
}) {
  const [input, setInput] = useState({
    title: "",
    description: "",
    category: "Top",
    imageKey: "white-tee",
    size: "M",
    condition: "Very good",
    mode: "Sell",
    price: "",
    city: "",
  });
  const task = useTask();
  const set = (k: string, v: string) =>
    setInput((x) => ({
      ...x,
      [k]: v,
      ...(k === "mode" && v === "Giveaway" ? { price: "0" } : {}),
    }));
  return (
    <Modal title="A new chapter for your piece." onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { price, ...rest } = input;
          task.run(
            {
              url: "market",
              method: "POST",
              body: {
                ...rest,
                priceCents:
                  input.mode === "Giveaway"
                    ? 0
                    : Math.round(Number(price || 0) * 100),
              },
            },
            onClose,
            "Your piece is in the sharing circle.",
          );
        }}
      >
        <ErrorBox error={task.error} />
        <div className="garment-form-layout">
          <div>
            <div className="form-main-photo">
              <Photo imageKey={input.imageKey} alt="Listing preview" />
            </div>
            <div className="photo-picker">
              {config.images.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={input.imageKey === key ? "selected" : ""}
                  aria-label={`Choose ${key}`}
                  onClick={() => set("imageKey", key)}
                >
                  <Photo imageKey={key} alt="" />
                </button>
              ))}
            </div>
            <p className="muted tiny">
              Choose from the licensed sample image collection.
            </p>
          </div>
          <div>
            <label className="field">
              <span>Listing title</span>
              <input
                required
                maxLength={80}
                value={input.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="A classic, ready for someone new"
              />
            </label>
            <label className="field">
              <span>Tell its story</span>
              <textarea
                required
                maxLength={800}
                value={input.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Condition, fit, handover details. For lending, include the return period."
              />
            </label>
            <div className="form-grid">
              <Select
                label="Share how?"
                options={["Sell", "Lend", "Giveaway"]}
                value={input.mode}
                onChange={(v) => set("mode", v)}
              />
              <Select
                label="Category"
                options={config.categories}
                value={input.category}
                onChange={(v) => set("category", v)}
              />
              <Select
                label="Condition"
                options={["New", "Like new", "Very good", "Good"]}
                value={input.condition}
                onChange={(v) => set("condition", v)}
              />
              <label className="field">
                <span>Size</span>
                <input
                  required
                  maxLength={15}
                  value={input.size}
                  onChange={(e) => set("size", e.target.value)}
                />
              </label>
              <label className="field">
                <span>
                  {input.mode === "Lend"
                    ? "Borrowing fee (USD)"
                    : "Price (USD)"}
                </span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  disabled={input.mode === "Giveaway"}
                  value={input.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="field">
                <span>Pickup city</span>
                <input
                  required
                  maxLength={60}
                  value={input.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Vinnytsia"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <p className="muted tiny">
            One piece per listing. Reservations hold it for one buyer.
          </p>
          <Button busy={task.busy}>
            <Plus size={16} />
            Publish listing
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Reservations() {
  const { data: orders = [], isLoading, error } = useOrdersQuery();
  const [tab, setTab] = useState("all");
  const task = useTask();
  const filtered = orders.filter(
    (o) => tab === "all" || (tab === "buying" ? !o.isSeller : o.isSeller),
  );
  const act = (o: Order, action: string) =>
    task.run(
      { url: `market/orders/${o.id}/action`, method: "POST", body: { action } },
      undefined,
      `Reservation ${action.toLowerCase()}${action === "Cancel" ? "led" : action === "Decline" ? "d" : action === "Complete" ? "d" : "ed"}.`,
    );
  return (
    <>
      <PageHeading
        eyebrow="FROM ONE WARDROBE TO ANOTHER"
        title="Your reservations."
        description="Keep track of the pieces you’re welcoming in and passing on."
      />
      <div className="category-tabs order-tabs">
        {[
          ["all", "All reservations"],
          ["buying", "For me"],
          ["selling", "From me"],
        ].map(([v, label]) => (
          <button
            className={tab === v ? "active" : ""}
            key={v}
            onClick={() => setTab(v)}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorBox error={error ? errorText(error) : task.error} />
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="Good things will find their way here">
          Reserve a piece in the sharing circle, or publish a listing of your
          own.
        </Empty>
      ) : (
        <div className="orders-list">
          {filtered.map((o) => (
            <article key={o.id} className="order-card">
              <Photo imageKey={o.listing.imageKey} alt={o.listing.title} />
              <div className="order-main">
                <div className="order-title">
                  <div>
                    <span className="eyebrow">
                      {o.isSeller ? "FROM YOUR WARDROBE" : "COMING YOUR WAY"} ·{" "}
                      {o.id.slice(0, 8)}
                    </span>
                    <h3>{o.listing.title}</h3>
                  </div>
                  <span className={`status-pill ${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                </div>
                <p>
                  {o.isSeller
                    ? `Requested by ${o.buyerName}`
                    : `Shared by ${o.listing.sellerName}`}{" "}
                  · {o.listing.city} ·{" "}
                  {o.totalCents ? money(o.totalCents) : "Free"}
                </p>
                {o.note && <blockquote>{o.note}</blockquote>}
                <div className="order-actions">
                  {o.isSeller && o.status === "Requested" && (
                    <>
                      <Button busy={task.busy} onClick={() => act(o, "Accept")}>
                        <Check size={15} />
                        Accept request
                      </Button>
                      <Button
                        secondary
                        busy={task.busy}
                        onClick={() => act(o, "Decline")}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {o.isSeller && o.status === "Accepted" && (
                    <Button busy={task.busy} onClick={() => act(o, "Complete")}>
                      <Check size={15} />
                      {o.listing.mode === "Lend"
                        ? "Mark returned"
                        : "Mark handed over"}
                    </Button>
                  )}
                  {!o.isSeller &&
                    ["Requested", "Accepted"].includes(o.status) && (
                      <Button
                        secondary
                        busy={task.busy}
                        onClick={() => act(o, "Cancel")}
                      >
                        Cancel request
                      </Button>
                    )}
                  <small>
                    {o.status === "Accepted"
                      ? "Accepted. Arrange handover using the details in the request."
                      : o.status === "Completed"
                        ? "Thank you for keeping good clothes in circulation."
                        : o.status === "Requested"
                          ? "Waiting for the owner to confirm."
                          : "This request is closed."}
                  </small>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="explain-note">
        <ShoppingBag size={18} />
        <p>
          <b>Simple, local exchanges.</b> Prices are in USD for this demo.
          Payments, shipping and private messaging are not processed by Thread.
        </p>
      </div>
    </>
  );
}
