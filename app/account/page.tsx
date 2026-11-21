import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, ImageIcon, Pencil, Plus, ShieldCheck } from "lucide-react";
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
              <li key={b.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 min-w-0 items-start gap-3">
                  <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold leading-snug text-foreground">{b.name}</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {b.category} · {b.town}
                    </div>
                    <span
                      className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[b.status].cls}`}
                    >
                      {STATUS[b.status].label}
                    </span>
                  </div>
                </div>

                {(!b.coverUrl || !b.logoUrl) && (
                  <Link
                    href={`/account/business/${b.id}/`}
                    className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-[13px] font-semibold text-[#8a5a10] hover:underline sm:hidden"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    {!b.coverUrl && !b.logoUrl
                      ? "הוסיפו תמונה ראשית ולוגו, כדי שהעסק יבלוט באינדקס"
                      : !b.coverUrl
                        ? "חסרה תמונה ראשית"
                        : "חסר לוגו"}
                  </Link>
                )}

                <div className="flex items-center gap-2 sm:shrink-0">
                  {(!b.coverUrl || !b.logoUrl) && (
                    <Link
                      href={`/account/business/${b.id}/`}
                      className="hidden max-w-[180px] text-xs font-semibold text-[#8a5a10] hover:underline sm:block"
                    >
                      {!b.coverUrl && !b.logoUrl
                        ? "הוסיפו תמונה ראשית ולוגו"
                        : !b.coverUrl
                          ? "חסרה תמונה ראשית"
                          : "חסר לוגו"}
                    </Link>
                  )}
                  {b.status === "approved" && (
                    <Link
                      href={`/business/${b.slug}/`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 min-h-11 rounded-xl border px-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary sm:flex-none"
                    >
                      <ExternalLink className="h-4 w-4" />
                      צפייה
                    </Link>
                  )}
                  <Link
                    href={`/account/business/${b.id}/`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:flex-none"
                  >
                    <Pencil className="h-4 w-4" />
                    עריכה
                  </Link>
                </div>
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
