"use client";

/**
 * Login / forgot-password / set-password / change-password forms.
 * All of them POST JSON to the Route Handlers under /api/auth and /api/account.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LogOut } from "lucide-react";

export async function postJson(url: string, body: unknown = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

export const inputClass =
  "w-full h-12 px-4 rounded-xl border border-input bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
export const buttonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 min-h-[52px] text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm";

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function SuccessBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-foreground">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
      <div>{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await postJson("/api/auth/login/", { email, password });
    setBusy(false);
    if (!ok) {
      setError((data.error as string) ?? "ההתחברות נכשלה");
      return;
    }
    const target =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : data.role === "admin"
          ? "/admin/"
          : "/account/";
    router.push(target);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="אימייל">
        <input
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="סיסמה">
        <input
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <ErrorBox message={error} />
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        כניסה
      </button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password/" className="text-primary hover:underline">
          שכחתי סיסמה / אין לי סיסמה
        </Link>
        <Link href="/register/" className="text-muted-foreground hover:text-primary">
          עסק חדש? הרשמה
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await postJson("/api/auth/forgot/", { email });
    setBusy(false);
    if (!ok) {
      setError((data.error as string) ?? "השליחה נכשלה");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <SuccessBox>
        אם הכתובת <strong dir="ltr">{email}</strong> רשומה אצלנו, נשלח אליה עכשיו קישור לקביעת
        סיסמה. הקישור תקף לשעתיים. לא הגיע? בדקו בתיקיית הספאם, או פנו אלינו ונשלח לכם קישור
        ידנית.
      </SuccessBox>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="האימייל של העסק">
        <input
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <ErrorBox message={error} />
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        שלחו לי קישור לקביעת סיסמה
      </button>
      <p className="text-center text-sm">
        <Link href="/login/" className="text-muted-foreground hover:text-primary">
          חזרה לכניסה
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("הסיסמאות לא זהות");
      return;
    }
    setBusy(true);
    setError(null);
    const { ok, data } = await postJson("/api/auth/reset/", { token, password });
    setBusy(false);
    if (!ok) {
      setError((data.error as string) ?? "השמירה נכשלה");
      return;
    }
    router.push(data.role === "admin" ? "/admin/" : "/account/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        קביעת סיסמה לחשבון <strong dir="ltr">{email}</strong>
      </p>
      {/* Lets password managers save the right username */}
      <input type="email" value={email} autoComplete="username" readOnly hidden />
      <Field label="סיסמה חדשה (לפחות 8 תווים)">
        <input
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="הקלידו שוב">
        <input
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </Field>
      <ErrorBox message={error} />
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        שמירה וכניסה
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    const { ok, data } = await postJson("/api/account/password/", {
      currentPassword: current,
      newPassword: next,
    });
    setBusy(false);
    if (!ok) {
      setError((data.error as string) ?? "השמירה נכשלה");
      return;
    }
    setCurrent("");
    setNext("");
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="סיסמה נוכחית">
        <input
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="סיסמה חדשה (לפחות 8 תווים)">
        <input
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
      </Field>
      <ErrorBox message={error} />
      {done && <SuccessBox>הסיסמה עודכנה.</SuccessBox>}
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        עדכון סיסמה
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await postJson("/api/auth/logout/");
        router.push("/");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
    >
      <LogOut className="h-4 w-4" />
      יציאה
    </button>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-ink pt-12 sm:pt-16 pb-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/v2/hero2.jpg')] bg-cover bg-center opacity-25"
      />
      <div className="container-page relative max-w-md">
      <div className="rounded-3xl bg-white p-6 sm:p-9 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
        {children}
      </div>
      </div>
    </div>
  );
}
