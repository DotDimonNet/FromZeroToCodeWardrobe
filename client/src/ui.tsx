import { useEffect, useId, useRef, useState, ReactNode } from "react";
import {
  X,
  ArrowRight,
  LoaderCircle,
  Image,
  Check,
  AlertCircle,
} from "lucide-react";
import { FetchArgs } from "@reduxjs/toolkit/query";
import {
  actions,
  errorText,
  useAppDispatch,
  useCommandMutation,
} from "./store";
export function useTask() {
  const [command, { isLoading }] = useCommandMutation();
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  async function run(
    args: FetchArgs,
    done?: (data: any) => void,
    message?: string,
  ) {
    setError("");
    try {
      const data = await command(args).unwrap();
      done?.(data);
      if (message) dispatch(actions.toast(message));
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  }
  return { run, busy: isLoading, error, setError };
}
export function ErrorBox({ error }: { error?: string }) {
  return error ? (
    <div className="error-box" role="alert">
      <AlertCircle size={17} />
      {error}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Putting everything in place…
    </div>
  );
}
export function Button({
  children,
  busy = false,
  secondary = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`button ${secondary ? "secondary" : ""} ${props.className || ""}`}
    >
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const root = ref.current!;
    const focusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex="0"]',
        ),
      );
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = focusable();
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={ref}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">MAKE IT YOURS</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((v) => (
          <option key={v} value={v}>
            {v === "All" ? "All seasons" : v === "Any" ? "Any" : v}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Photo({
  imageKey,
  alt,
  className = "",
}: {
  imageKey: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      className={`photo ${className}`}
      src={`/images/${imageKey}.webp`}
      alt={alt}
      loading="lazy"
    />
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Image size={30} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Success({ children }: { children: ReactNode }) {
  return (
    <div className="success">
      <Check size={18} />
      <div>{children}</div>
    </div>
  );
}
export function ArrowLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
