import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Pencil, Plus, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessesByOwner } from "@/lib/db";
import type { BusinessStatus } from "@/lib/types";
import { ChangePasswordForm, LogoutButton } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "האזור האישי",
  robots: { index: false, follow: false },
};

const STATUS: Record<BusinessStatus, { label: string; cls: string }> = {
  approved: { label: "מופיע באתר", cls: "bg-success/10 text-success" },
  pending: { label: "ממתין לאישור", cls: "bg-accent-soft text-[#8a5a10]" },
  rejected: { label: "לא אושר", cls: "bg-destructive/10 text-destructive" },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/account/");
  const businesses = await getBusinessesByOwner(user.id);

  return (
    <>
    <section className="bg-ink pb-24">
      <div className="container-page max-w-4xl pt-9 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-gold-text">האזור האישי</span>
          <h1 className="text-3xl sm:text-[42px] font-black tracking-tight text-white">העסקים שלי</h1>
          <p className="text-[15px] text-[#cfd6d0]">
            מחוברים בתור <span dir="ltr">{user.email}</span>. כל שינוי שתשמרו מופיע באתר מיד.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link
              href="/admin/"
              className="inline-flex items-center gap-1.5 min-h-11 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              ניהול
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </section>
    <div className="container-page max-w-4xl -mt-16 pb-16 space-y-6">

      <section className="rounded-[22px] bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(16,35,26,0.1)]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-extrabold">העסקים שלי</h2>
          <Link
            href="/register/"
            className="inline-flex items-center gap-1.5 min-h-11 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
          >
            <Plus className="h-4 w-4" />
            הוספת עסק
          </Link>
        </div>

        {businesses.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            לא מצאנו עסקים שמשויכים לאימייל הזה. אם העסק שלכם כבר באתר עם אימייל אחר - פנו אלינו
            ונעדכן.
          </p>
        ) : (
          <ul className="divide-y">
            {businesses.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.category} · {b.town}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[b.status].cls}`}>
                  {STATUS[b.status].label}
                </span>
                {b.status === "approved" && (
                  <Link
                    href={`/business/${b.slug}/`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    צפייה
                  </Link>
                )}
                <Link
                  href={`/account/business/${b.id}/`}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  עריכה
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[22px] border border-[#eae3d5] bg-white p-6 sm:p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">שינוי סיסמה</h2>
        <ChangePasswordForm />
      </section>
    </div>
    </>
  );
}
