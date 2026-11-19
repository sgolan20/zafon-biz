"use client";

/**
 * Login / forgot-password / set-password / change-password forms.
 * All of them POST JSON to the Route Handlers under /api/auth and /api/account.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, LogOut, Mail, Info } from "lucide-react";

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
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Optional element shown at the end of the label row (e.g. "forgot password?"). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Text input with a leading icon (RTL: icon on the right). */
function IconInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input {...props} className={`${inputClass} pr-11`} />
    </div>
  );
}

/**
 * Password input with a show/hide (eye) toggle. The toggle sits on the left
 * (the end side in RTL) and the lock icon on the right.
 */
export function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Lock className="h-[18px] w-[18px]" />
      </span>
      <input
        {...props}
        type={visible ? "text" : "password"}
        dir="ltr"
        className={`${inputClass} pr-11 pl-12 text-right`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
        aria-pressed={visible}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
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
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="אימייל" htmlFor="login-email">
        <IconInput
          id="login-email"
          icon={<Mail className="h-[18px] w-[18px]" />}
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field
        label="סיסמה"
        htmlFor="login-password"
        aside={
          <Link href="/forgot-password/" className="text-sm font-semibold text-primary hover:underline">
            שכחתי סיסמה
          </Link>
        }
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <ErrorBox message={error} />
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        כניסה לאזור האישי
      </button>

      <div className="flex items-start gap-2.5 rounded-xl bg-muted/70 p-3.5 text-sm leading-relaxed text-[#3e4a43]">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
        <p>
          <strong className="font-bold text-foreground">פעם ראשונה כאן?</strong> העסק שלכם כבר באתר
          אבל עוד אין לכם סיסמה?{" "}
          <Link href="/forgot-password/" className="font-semibold text-primary hover:underline">
            קבעו סיסמה
          </Link>{" "}
          עם האימייל של העסק.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-1 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        עסק חדש באתר?
        <span className="h-px flex-1 bg-border" />
      </div>
      <Link
        href="/register/"
        className="inline-flex w-full items-center justify-center min-h-[52px] rounded-xl border border-input bg-white px-6 text-base font-bold text-foreground hover:border-primary hover:text-primary transition"
      >
        הוסיפו את העסק שלכם בחינם
      </Link>
    </form>
  );
}

export function ForgotPasswordForm({ emailEnabled }: { emailEnabled: boolean }) {
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

  if (!emailEnabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft p-4 text-[15px] leading-relaxed text-[#3e4a43]">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8a5a10]" />
          <p>
            שליחת קישור במייל תופעל בקרוב. בינתיים שלחו לנו הודעה עם שם העסק והאימייל שלו, ונשלח
            לכם קישור אישי לקביעת סיסמה.
          </p>
        </div>
        <a
          href="mailto:sgolan20@gmail.com?subject=%D7%A7%D7%91%D7%99%D7%A2%D7%AA%20%D7%A1%D7%99%D7%A1%D7%9E%D7%94%20-%20%D7%AA%D7%95%D7%9E%D7%9B%D7%99%D7%9D%20%D7%91%D7%A6%D7%A4%D7%95%D7%9F"
          className={buttonClass}
        >
          <Mail className="h-5 w-5" />
          שליחת בקשה במייל
        </a>
        <p className="text-center text-sm">
          <Link href="/login/" className="font-semibold text-muted-foreground hover:text-primary">
            חזרה לכניסה
          </Link>
        </p>
      </div>
    );
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
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="האימייל של העסק" htmlFor="forgot-email">
        <IconInput
          id="forgot-email"
          icon={<Mail className="h-[18px] w-[18px]" />}
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <ErrorBox message={error} />
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        שלחו לי קישור לקביעת סיסמה
      </button>
      <p className="text-center text-sm">
        <Link href="/login/" className="font-semibold text-muted-foreground hover:text-primary">
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
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        קביעת סיסמה לחשבון <strong dir="ltr">{email}</strong>
      </p>
      {/* Lets password managers save the right username */}
      <input type="email" value={email} autoComplete="username" readOnly hidden />
      <Field label="סיסמה חדשה (לפחות 8 תווים)" htmlFor="reset-password">
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="הקלידו שוב" htmlFor="reset-confirm">
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
      <Field label="סיסמה נוכחית" htmlFor="current-password">
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="סיסמה חדשה (לפחות 8 תווים)" htmlFor="new-password">
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
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

/**
 * Split layout for the auth pages: the form on one side, a full-height photo
 * of the north with a short message on the other (hidden on phones).
 */
export function AuthCard({
  title,
  subtitle,
  eyebrow = "לבעלי עסקים",
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-84px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex items-center justify-center px-4 sm:px-10 py-12 sm:py-16">
        <div className="w-full max-w-[460px]">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-2 text-[32px] sm:text-[40px] leading-[1.1] font-black tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 mb-8 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-8" />}
          {children}
        </div>
      </div>

      <aside className="relative hidden lg:block overflow-hidden bg-primary">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[url('/images/v2/jeep.jpg')] bg-cover bg-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[rgba(14,32,24,0.92)] via-[rgba(14,32,24,0.25)] to-[rgba(14,32,24,0.05)]"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-12 xl:p-14">
          <span className="text-[30px] xl:text-[34px] leading-[1.2] font-extrabold text-white">
            העסק שלכם, בידיים שלכם.
          </span>
          <span className="max-w-[440px] text-[17px] leading-relaxed text-[#e8e2d4]">
            מעדכנים טלפון, שעות פעילות ותיאור מתי שרוצים, והשינויים מופיעים באתר מיד.
          </span>
        </div>
      </aside>
    </div>
  );
}
