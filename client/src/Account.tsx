import { FormEvent, useState } from "react";
import { ArrowUpRight, Leaf, Mail, ArrowLeft, LogOut } from "lucide-react";
import { actions, Config, User, useAppDispatch, api } from "./store";
import { Brand, Button, ErrorBox, Modal, Success, useTask, Photo } from "./ui";

export function AccountGate({ config }: { config: Config }) {
  const query = new URLSearchParams(location.search);
  const initial = query.get("flow") || "login";
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [devLink, setDevLink] = useState("");
  const task = useTask();
  const dispatch = useAppDispatch();
  function changeMode(value: string) {
    setMode(value);
    setNotice("");
    setDevLink("");
    task.setError("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    let body: Record<string, string> = { email };
    let url = mode;
    if (mode === "login") body = { email, password };
    if (mode === "register") body = { email, password, displayName: name };
    if (mode === "activate" || mode === "reset")
      body = {
        userId: query.get("userId") || "",
        token: query.get("token") || "",
        ...(mode === "reset" ? { password } : {}),
      };
    await task.run(
      { url: `auth/${url}`, method: "POST", body },
      (data) => {
        if (mode === "login") {
          history.replaceState({}, "", "/");
          dispatch(actions.navigate("wardrobe"));
        } else {
          setNotice(data.message);
          setDevLink(data.developmentLink || "");
        }
      },
      mode === "login" ? "Welcome to your wardrobe." : undefined,
    );
  }
  const titles: Record<string, string> = {
    login: "A little less clutter.\nA little more you.",
    register: "Make room for\nyour own style.",
    forgot: "A fresh start.",
    activate: "One small step.",
    reset: "Your new password.",
    "resend-activation": "Let’s try that again.",
  };
  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="wordmark" href="/">
          <Brand />
        </a>
        <div className="auth-copy">
          <span className="eyebrow">YOUR WARDROBE, CONSIDERED.</span>
          <h1>
            Good style.
            <br />
            Already yours.
          </h1>
          <p>
            Rediscover what you own. Put looks together.
            <br />
            Give good pieces another chapter.
          </p>
        </div>
        <div className="auth-collage">
          <div className="auth-photo one">
            <Photo
              imageKey="denim-shirt"
              alt="The texture of a well-loved denim shirt"
            />
          </div>
          <div className="auth-photo two">
            <Photo
              imageKey="retro-shoes"
              alt="Blue vintage-inspired trainers"
            />
          </div>
          <span className="circle-stamp">
            LESS STUFF
            <br />
            <Leaf size={24} />
            <br />
            MORE STYLE
          </span>
        </div>
        <p className="auth-footer">
          A thoughtful home for the things you wear.
        </p>
      </section>
      <section className="auth-form-area">
        <span className="eyebrow">WELCOME TO THREAD</span>
        <h2>{titles[mode] || titles.login}</h2>
        <p>
          {mode === "login"
            ? "Sign in and find something good to wear."
            : mode === "register"
              ? "Start with the clothes you already love."
              : "We’ll help you get back to your wardrobe."}
        </p>
        <ErrorBox
          error={task.error || (!notice ? query.get("authError") || "" : "")}
        />
        {notice ? (
          <>
            <Success>{notice}</Success>
            {devLink && (
              <div className="dev-note">
                <b>Local demo · no email was sent</b>
                <p>
                  Use the link below to test this flow. These links are never
                  exposed in production.
                </p>
                <a href={devLink}>
                  Open {mode === "forgot" ? "password reset" : "activation"}{" "}
                  link <ArrowUpRight size={14} />
                </a>
              </div>
            )}
            <Button
              secondary
              onClick={() => {
                history.replaceState({}, "", "/");
                changeMode("login");
              }}
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <form onSubmit={submit}>
            {mode === "register" && (
              <label className="field">
                <span>Your name</span>
                <input
                  autoComplete="name"
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            {!["activate", "reset"].includes(mode) && (
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            )}
            {["login", "register", "reset"].includes(mode) && (
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "login" ? 1 : 10}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
                {mode !== "login" && (
                  <small>
                    10+ characters, uppercase, lowercase, number and symbol.
                  </small>
                )}
              </label>
            )}
            <Button type="submit" busy={task.busy} className="full-width">
              {
                (
                  {
                    login: "Sign in",
                    register: "Create my account",
                    forgot: "Send reset link",
                    activate: "Activate my account",
                    reset: "Set new password",
                    "resend-activation": "Send activation link",
                  } as Record<string, string>
                )[mode]
              }
              <ArrowUpRight size={18} />
            </Button>
          </form>
        )}
        {mode === "login" && !notice && (
          <>
            <div className="auth-links">
              <button onClick={() => changeMode("forgot")}>
                Forgot password?
              </button>
              <button onClick={() => changeMode("resend-activation")}>
                Activate account
              </button>
            </div>
            <div className="divider">
              <span>or continue with</span>
            </div>
            <div className="social-buttons">
              {["Google", "Facebook"].map((provider) => (
                <a
                  key={provider}
                  href={
                    config.providers.includes(provider)
                      ? `/api/auth/external/${provider}`
                      : undefined
                  }
                  aria-disabled={!config.providers.includes(provider)}
                  title={
                    !config.providers.includes(provider)
                      ? "Requires provider credentials on the server"
                      : undefined
                  }
                  className={
                    !config.providers.includes(provider) ? "disabled" : ""
                  }
                >
                  <b>{provider === "Google" ? "G" : "f"}</b>
                  {provider}
                </a>
              ))}
            </div>
            {config.providers.length < 2 && (
              <p className="muted tiny">
                Social sign-in becomes available when provider credentials are
                configured.
              </p>
            )}
            <p className="switch-auth">
              New here?{" "}
              <button onClick={() => changeMode("register")}>
                Create an account
              </button>
            </p>
            {config.demoMode && (
              <div className="demo-entry">
                <span className="eyebrow">TAKE A LOOK AROUND</span>
                <Button
                  secondary
                  busy={task.busy}
                  onClick={() =>
                    task.run({ url: "auth/demo", method: "POST" }, () =>
                      dispatch(actions.navigate("wardrobe")),
                    )
                  }
                >
                  Explore the demo <ArrowUpRight size={17} />
                </Button>
                <small>A sample wardrobe. No account needed.</small>
              </div>
            )}
          </>
        )}
        {mode !== "login" && !notice && (
          <button
            className="text-link back-link"
            onClick={() => {
              history.replaceState({}, "", "/");
              changeMode("login");
            }}
          >
            <ArrowLeft size={15} />
            Back to sign in
          </button>
        )}
      </section>
    </div>
  );
}
export function Profile({
  user,
  config,
  onClose,
}: {
  user: User;
  config: Config;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.displayName),
    [city, setCity] = useState(user.city),
    [current, setCurrent] = useState(""),
    [password, setPassword] = useState("");
  const task = useTask();
  const dispatch = useAppDispatch();
  async function logout() {
    await task.run({ url: "auth/logout", method: "POST" }, () => {
      onClose();
      dispatch(api.util.resetApiState());
      dispatch(actions.resetFilters());
      dispatch(actions.navigate("wardrobe"));
    });
  }
  return (
    <Modal title="Your profile" onClose={onClose}>
      <div className="profile-card">
        <div className="avatar large">{user.displayName.slice(0, 1)}</div>
        <div>
          <h3>{user.displayName}</h3>
          <p>{user.email}</p>
          <span className="status-pill">Activated account</span>
        </div>
      </div>
      <ErrorBox error={task.error} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          task.run(
            {
              url: "auth/profile",
              method: "PUT",
              body: { displayName: name, city },
            },
            undefined,
            "Profile updated.",
          );
        }}
      >
        <label className="field">
          <span>Name</span>
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>City</span>
          <input
            maxLength={60}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <Button busy={task.busy}>Save profile</Button>
      </form>
      {user.hasPassword && (
        <details className="details">
          <summary>Change password</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              task.run(
                {
                  url: "auth/password",
                  method: "POST",
                  body: { currentPassword: current, newPassword: password },
                },
                () => {
                  setCurrent("");
                  setPassword("");
                },
                "Password updated.",
              );
            }}
          >
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small>
                10+ characters, uppercase, lowercase, number and symbol.
              </small>
            </label>
            <Button secondary busy={task.busy}>
              Update password
            </Button>
          </form>
        </details>
      )}
      <div className="modal-footer">
        <Button secondary busy={task.busy} onClick={logout}>
          <LogOut size={16} />
          Sign out
        </Button>
        {config.demoMode && (
          <button
            className="text-link"
            disabled={task.busy}
            onClick={() =>
              task.run(
                {
                  url: `auth/demo?seller=${user.email !== "maya@example.test"}`,
                  method: "POST",
                },
                () => {
                  onClose();
                  dispatch(api.util.resetApiState());
                  dispatch(actions.navigate("orders"));
                },
                "Demo account switched.",
              )
            }
          >
            Switch demo role
            <ArrowUpRight size={15} />
          </button>
        )}
      </div>
    </Modal>
  );
}
