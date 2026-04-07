"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Loader2,
  LogOut,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  User as UserIcon,
  Mail,
  Globe,
  Clock,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { Business } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <AdminDashboard user={user} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError("התחברות נכשלה. בדקו את האימייל והסיסמה.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-20 max-w-sm">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          כניסת מנהל
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          תומכים בצפון - פאנל ניהול
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full h-11 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="w-full h-11 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "התחבר"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ user }: { user: User }) {
  const [pending, setPending] = useState<Business[]>([]);
  const [approved, setApproved] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  async function loadBusinesses() {
    setLoading(true);
    try {
      const [pendingSnap, approvedSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "businesses"),
            where("status", "==", "pending"),
            orderBy("createdAt", "desc"),
          ),
        ),
        getDocs(
          query(
            collection(db, "businesses"),
            where("status", "==", "approved"),
            orderBy("approvedAt", "desc"),
          ),
        ),
      ]);
      setPending(pendingSnap.docs.map((d) => mapDoc(d.id, d.data())));
      setApproved(approvedSnap.docs.map((d) => mapDoc(d.id, d.data())));
    } catch (e) {
      console.error("Failed to load businesses:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function approve(business: Business) {
    setActionId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: user.email,
      });
      await loadBusinesses();
    } catch (e) {
      console.error(e);
      alert("שגיאה באישור העסק");
    } finally {
      setActionId(null);
    }
  }

  async function reject(business: Business) {
    if (!confirm(`למחוק את "${business.name}" לצמיתות? פעולה זו לא ניתנת לביטול.`)) {
      return;
    }
    setActionId(business.id);
    try {
      await deleteDoc(doc(db, "businesses", business.id));
      await loadBusinesses();
    } catch (e) {
      console.error(e);
      alert("שגיאה במחיקה");
    } finally {
      setActionId(null);
    }
  }

  async function unapprove(business: Business) {
    if (!confirm(`להחזיר את "${business.name}" למצב 'ממתין'?`)) return;
    setActionId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), {
        status: "pending",
      });
      await loadBusinesses();
    } catch (e) {
      console.error(e);
    } finally {
      setActionId(null);
    }
  }

  const list = tab === "pending" ? pending : approved;

  return (
    <div className="container-page py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פאנל ניהול</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "pending"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ממתינים לאישור ({pending.length})
        </button>
        <button
          onClick={() => setTab("approved")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "approved"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          מאושרים ({approved.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          {tab === "pending" ? "אין עסקים ממתינים לאישור" : "אין עסקים מאושרים"}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <BusinessReviewCard
              key={b.id}
              business={b}
              isAction={actionId === b.id}
              onApprove={() => approve(b)}
              onReject={() => reject(b)}
              onUnapprove={() => unapprove(b)}
              tab={tab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessReviewCard({
  business,
  isAction,
  onApprove,
  onReject,
  onUnapprove,
  tab,
}: {
  business: Business;
  isAction: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUnapprove: () => void;
  tab: "pending" | "approved";
}) {
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{business.name}</h3>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-soft px-2 py-0.5 rounded">
            {business.category}
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/80 mb-4 leading-relaxed whitespace-pre-line">
        {business.description}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground mb-4">
        <Detail icon={<MapPin className="h-4 w-4" />}>
          {business.town}
          {business.address && ` - ${business.address}`}
        </Detail>
        <Detail icon={<UserIcon className="h-4 w-4" />}>{business.contactName}</Detail>
        <Detail icon={<Phone className="h-4 w-4" />}>
          <span dir="ltr">{formatPhone(business.phone)}</span>
        </Detail>
        {business.email && (
          <Detail icon={<Mail className="h-4 w-4" />}>{business.email}</Detail>
        )}
        {business.website && (
          <Detail icon={<Globe className="h-4 w-4" />}>{business.website}</Detail>
        )}
        {business.openingHours && (
          <Detail icon={<Clock className="h-4 w-4" />}>{business.openingHours}</Detail>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t">
        {tab === "pending" ? (
          <>
            <button
              onClick={onApprove}
              disabled={isAction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {isAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              אשר ופרסם
            </button>
            <button
              onClick={onReject}
              disabled={isAction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-destructive text-destructive px-4 py-2 text-sm font-bold hover:bg-destructive/5 disabled:opacity-50 transition"
            >
              <XCircle className="h-4 w-4" />
              מחק
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onUnapprove}
              disabled={isAction}
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition"
            >
              {isAction ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              החזר ל'ממתין'
            </button>
            <button
              onClick={onReject}
              disabled={isAction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-destructive text-destructive px-4 py-2 text-sm font-bold hover:bg-destructive/5 disabled:opacity-50 transition"
            >
              <XCircle className="h-4 w-4" />
              מחק לצמיתות
            </button>
          </>
        )}
      </div>
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

function mapDoc(id: string, data: Record<string, unknown>): Business {
  return {
    id,
    status: data.status as Business["status"],
    name: data.name as string,
    slug: (data.slug as string) ?? "",
    description: (data.description as string) ?? "",
    shortDescription: data.shortDescription as string | undefined,
    category: (data.category as string) ?? "",
    subCategory: data.subCategory as string | undefined,
    tags: data.tags as string[] | undefined,
    town: (data.town as string) ?? "",
    region: data.region as string | undefined,
    address: data.address as string | undefined,
    contactName: (data.contactName as string) ?? "",
    phone: (data.phone as string) ?? "",
    whatsapp: data.whatsapp as string | undefined,
    email: data.email as string | undefined,
    website: data.website as string | undefined,
    openingHours: data.openingHours as string | undefined,
    facebook: data.facebook as string | undefined,
    instagram: data.instagram as string | undefined,
    createdAt:
      data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt
        ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
        : new Date().toISOString(),
    approvedAt:
      data.approvedAt && typeof data.approvedAt === "object" && "toDate" in data.approvedAt
        ? (data.approvedAt as { toDate: () => Date }).toDate().toISOString()
        : undefined,
    approvedBy: data.approvedBy as string | undefined,
    shuffleSeed: (data.shuffleSeed as number) ?? 0,
  };
}
