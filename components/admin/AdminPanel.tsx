"use client";

/**
 * Admin panel UI. Data comes from the server page (app/admin/page.tsx);
 * actions call /api/admin/* and then router.refresh() to reload it.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Trash2,
  Undo2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import type { Business } from "@/lib/types";
import type { UserOverview } from "@/lib/db";
import { formatPhone, telLink } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/AuthForms";

type Tab = "pending" | "approved" | "rejected" | "users";

export function AdminPanel({
  adminEmail,
  pending,
  approved,
  rejected,
  users,
  emailEnabled,
}: {
  adminEmail: string;
  pending: Business[];
  approved: Business[];
  rejected: Business[];
  users: UserOverview[];
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(pending.length > 0 ? "pending" : "approved");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function call(id: string, method: "PATCH" | "DELETE", body?: unknown) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${id}/`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "הפעולה נכשלה");
      return;
    }
    router.refresh();
  }

  const setStatus = (b: Business, status: Business["status"]) =>
    call(b.id, "PATCH", { status });
  const remove = (b: Business) => {
    if (confirm(`למחוק את "${b.name}" לצמיתות? אי אפשר לבטל את זה.`)) call(b.id, "DELETE");
  };

  const lists: Record<Exclude<Tab, "users">, Business[]> = { pending, approved, rejected };
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (tab === "users") return [];
    const list = lists[tab];
    if (!q) return list;
    return list.filter((b) =>
      [b.name, b.town, b.category, b.email, b.phone, b.contactName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, pending, approved, rejected]);

  const filteredUsers = useMemo(
    () =>
      q
        ? users.filter(
            (u) =>
              u.email.includes(q) || u.businessNames.some((n) => n.toLowerCase().includes(q)),
          )
        : users,
    [users, q],
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "ממתינים", count: pending.length },
    { key: "approved", label: "מאושרים", count: approved.length },
    { key: "rejected", label: "נדחו", count: rejected.length },
    { key: "users", label: "משתמשים", count: users.length },
  ];

  return (
    <div className="container-page py-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פאנל ניהול</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {adminEmail}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, יישוב, אימייל, טלפון..."
            className="w-full h-10 pr-9 pl-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {tab === "users" ? (
        <UsersTable users={filteredUsers} emailEnabled={emailEnabled} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          אין עסקים להצגה
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <BusinessCard key={b.id} business={b} busy={busyId === b.id}>
              {b.status !== "approved" && (
                <ActionButton
                  tone="success"
                  busy={busyId === b.id}
                  onClick={() => setStatus(b, "approved")}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  אשר ופרסם
                </ActionButton>
              )}
              {b.status === "pending" && (
                <ActionButton
                  tone="plain"
                  onClick={() => setStatus(b, "rejected")}
                  icon={<XCircle className="h-4 w-4" />}
                >
                  דחה
                </ActionButton>
              )}
              {b.status !== "pending" && (
                <ActionButton
                  tone="plain"
                  onClick={() => setStatus(b, "pending")}
                  icon={<Undo2 className="h-4 w-4" />}
                >
                  החזר לממתין
                </ActionButton>
              )}
              <Link
                href={`/admin/business/${b.id}/`}
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
              >
                <Pencil className="h-4 w-4" />
                עריכה
              </Link>
              {b.status === "approved" && (
                <Link
                  href={`/business/${b.slug}/`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  בדף
                </Link>
              )}
              <ActionButton
                tone="danger"
                onClick={() => remove(b)}
                icon={<Trash2 className="h-4 w-4" />}
              >
                מחק
              </ActionButton>
            </BusinessCard>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  tone,
  busy,
  onClick,
  icon,
  children,
}: {
  tone: "success" | "plain" | "danger";
  busy?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls = {
    success: "bg-success text-white font-bold hover:opacity-90",
    plain: "border font-medium hover:bg-muted",
    danger: "bg-white border border-destructive text-destructive font-bold hover:bg-destructive/5",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm disabled:opacity-50 transition ${cls}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

function BusinessCard({
  business,
  busy,
  children,
}: {
  business: Business;
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{business.name}</h3>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-soft px-2 py-0.5 rounded">
            {business.category}
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-left">
          נרשם {new Date(business.createdAt).toLocaleDateString("he-IL")}
          {business.updatedAt && (
            <div>עודכן {new Date(business.updatedAt).toLocaleDateString("he-IL")}</div>
          )}
          {!business.ownerId && <div className="text-destructive">אין בעלים (חסר אימייל)</div>}
        </div>
      </div>

      <details className="mb-3">
        <summary className="cursor-pointer text-sm text-muted-foreground">תיאור</summary>
        <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
          {business.description}
        </p>
      </details>

      <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground mb-4">
        <Detail icon={<MapPin className="h-4 w-4" />}>
          {business.town}
          {business.address && ` - ${business.address}`}
        </Detail>
        <Detail icon={<UserIcon className="h-4 w-4" />}>{business.contactName}</Detail>
        <Detail icon={<Phone className="h-4 w-4" />}>
          <a href={telLink(business.phone)} className="text-primary hover:underline" dir="ltr">
            {formatPhone(business.phone)}
          </a>
        </Detail>
        {business.email && (
          <Detail icon={<Mail className="h-4 w-4" />}>
            <span className="break-all" dir="ltr">
              {business.email}
            </span>
          </Detail>
        )}
        {business.website && (
          <Detail icon={<Globe className="h-4 w-4" />}>
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {business.website.replace(/^https?:\/\//, "")}
            </a>
          </Detail>
        )}
        {business.openingHours && (
          <Detail icon={<Clock className="h-4 w-4" />}>{business.openingHours}</Detail>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t">{children}</div>
    </article>
  );
}

function Detail({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary/70">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function UsersTable({ users, emailEnabled }: { users: UserOverview[]; emailEnabled: boolean }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function makeLink(u: UserOverview, sendEmail: boolean) {
    setBusy(u.id);
    setNote(null);
    const res = await fetch(`/api/admin/users/${u.id}/link/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendEmail }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      link?: string;
      emailed?: boolean;
      hours?: number;
      error?: string;
    };
    setBusy(null);
    if (!res.ok || !data.link) {
      setNote(data.error ?? "יצירת הקישור נכשלה");
      return;
    }
    setLinks((l) => ({ ...l, [u.id]: data.link! }));
    try {
      await navigator.clipboard.writeText(data.link);
      setNote(
        `${data.emailed ? "הקישור נשלח במייל וגם הועתק" : "הקישור הועתק"} - תקף ל-${data.hours} שעות ולשימוש אחד.`,
      );
    } catch {
      setNote(`הקישור נוצר (תקף ל-${data.hours} שעות). העתיקו אותו מהטבלה.`);
    }
  }

  const withPassword = users.filter((u) => u.hasPassword).length;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {withPassword} מתוך {users.length} משתמשים כבר קבעו סיסמה.
        {!emailEnabled &&
          " שליחת מיילים עדיין לא מחוברת - אפשר ליצור קישור לקביעת סיסמה ולשלוח אותו בוואטסאפ."}
      </p>
      {note && (
        <div className="mb-3 rounded-lg bg-success/10 border border-success/30 p-3 text-sm">
          {note}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-right p-3 font-medium">אימייל</th>
              <th className="text-right p-3 font-medium">עסקים</th>
              <th className="text-right p-3 font-medium">סיסמה</th>
              <th className="text-right p-3 font-medium">כניסה אחרונה</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="p-3" dir="ltr">
                  <div className="text-right break-all">{u.email}</div>
                  {u.role === "admin" && (
                    <span className="text-xs font-bold text-primary">אדמין</span>
                  )}
                </td>
                <td className="p-3">{u.businessNames.join(", ") || "-"}</td>
                <td className="p-3">
                  {u.hasPassword ? (
                    <span className="text-success">✓ קבע</span>
                  ) : (
                    <span className="text-muted-foreground">עדיין לא</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("he-IL") : "-"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <button
                      onClick={() => makeLink(u, false)}
                      disabled={busy === u.id}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      title="יוצר קישור חד-פעמי לקביעת סיסמה ומעתיק אותו"
                    >
                      {busy === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      העתק קישור סיסמה
                    </button>
                    {emailEnabled && (
                      <button
                        onClick={() => makeLink(u, true)}
                        disabled={busy === u.id}
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        שלח במייל
                      </button>
                    )}
                  </div>
                  {links[u.id] && (
                    <input
                      readOnly
                      value={links[u.id]}
                      dir="ltr"
                      onFocus={(e) => e.currentTarget.select()}
                      className="mt-2 w-full rounded border px-2 py-1 text-xs"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
