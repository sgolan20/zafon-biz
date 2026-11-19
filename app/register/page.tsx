import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getApprovedBusinesses, getCategories, getTowns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הוסיפו את העסק שלכם",
  description:
    "הוסיפו את העסק שלכם לאינדקס תומכים בצפון. רישום חינם - רק פרטים בסיסיים. אישור תוך 24-48 שעות.",
};

const PROMISES = ["חינם לגמרי, בלי עמלות", "אישור בדרך כלל תוך יום", "עריכה עצמית מהאזור האישי"];

export default async function RegisterPage() {
  const [categories, towns, user, businesses] = await Promise.all([
    getCategories(),
    getTowns(),
    getCurrentUser(),
    getApprovedBusinesses(),
  ]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] min-h-full">
      {/* Form side */}
      <div className="px-4 sm:px-10 lg:px-16 xl:px-20 py-10 sm:py-14 flex flex-col gap-8 sm:gap-9">
        <div className="flex flex-col gap-2.5 max-w-[640px]">
          <span className="eyebrow">הצטרפות חינמית</span>
          <h1 className="text-[34px] sm:text-[46px] leading-[1.08] font-black tracking-tight">
            הוסיפו את העסק שלכם לאינדקס
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            אתם בעלי עסק מקריית שמונה, אצבע הגליל, רמת הגולן או יישובי קו העימות? שאלה אחת בכל
            פעם, שתיים-שלוש דקות בסך הכול.
            {user
              ? " העסק יתווסף לחשבון שלכם."
              : " בסוף תבחרו מייל וסיסמה, ותוכלו לעדכן את העסק מתי שרוצים."}
          </p>
          {!user && (
            <p className="text-[15px]">
              כבר רשומים?{" "}
              <Link href="/login/?next=/register/" className="font-bold text-primary hover:underline">
                היכנסו
              </Link>{" "}
              כדי להוסיף עסק נוסף לחשבון.
            </p>
          )}
        </div>

        <div className="max-w-[640px]">
          <RegistrationForm categories={categories} towns={towns} loggedInEmail={user?.email ?? null} />
        </div>

        <ul className="max-w-[640px] flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-[#3e4a43]">
          {PROMISES.map((p) => (
            <li key={p} className="inline-flex items-center gap-2">
              <Check className="h-[18px] w-[18px] text-success" strokeWidth={2.6} />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Image side */}
      <aside className="relative hidden lg:block bg-primary">
        <div className="sticky top-[76px] h-[calc(100vh-76px)] min-h-[560px]">
          <Image
            src="/images/v2/salon.jpg"
            alt="ספרית מעצבת שיער במספרה שכונתית בצפון"
            fill
            sizes="45vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[rgba(14,32,24,0.9)] via-[rgba(14,32,24,0.2)] to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-12 flex flex-col gap-3">
            <span className="text-[56px] leading-none font-black text-gold-text">{businesses.length}</span>
            <span className="text-[26px] leading-snug font-extrabold text-white">
              עסקים מהצפון כבר כאן.
              <br />
              העסק שלכם הבא בתור.
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
