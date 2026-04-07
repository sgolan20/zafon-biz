import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Heart, Clock, ArrowLeft } from "lucide-react";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getCategories, getTowns } from "@/lib/firebase-admin";

export const metadata: Metadata = {
  title: "הוסיפו את העסק שלכם",
  description:
    "הוסיפו את העסק שלכם לאינדקס תומכים בעורף. רישום חינם, ללא הרשמה - רק פרטים בסיסיים. אישור תוך 24-48 שעות.",
};

export default async function RegisterPage() {
  const [categories, towns] = await Promise.all([getCategories(), getTowns()]);

  return (
    <div className="bg-gradient-to-b from-primary-soft/40 to-background min-h-full">
      <div className="container-page py-10 sm:py-14 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 rotate-180" />
          חזרה לאתר
        </Link>

        {/* Explainer section */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border shadow-sm text-sm font-medium text-primary mb-4">
            <Heart className="h-4 w-4" fill="currentColor" />
            <span>הצטרפות חינמית</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            הוסיפו את העסק שלכם
            <br />
            <span className="text-primary">לאינדקס תומכים בעורף</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            אתם בעלי עסק מקריית שמונה, אצבע הגליל, רמת הגולן או יישובי קו העימות שנפגעו
            מהמלחמה? המקום הזה הוא שלכם. רישום חינמי לחלוטין, וללא צורך ביצירת חשבון.
          </p>

          {/* How it works */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Step
              num={1}
              title="ממלאים את הטופס"
              text="פרטי העסק, איש קשר, ותחום עיסוק. לוקח 2-3 דקות."
            />
            <Step
              num={2}
              title="אנחנו בודקים"
              text="צוות הפרויקט מאשר את העסק תוך 24-48 שעות."
            />
            <Step
              num={3}
              title="העסק עולה לאתר"
              text="דף נחיתה מעוצב עם כל הפרטים, נגיש בגוגל ובשיתוף."
            />
          </div>

          {/* Trust signals */}
          <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="font-bold">חינם לגמרי</strong> - אין עלות, אין הסכם, אין
                מחויבות. זה פרויקט קהילתי ללא מטרות רווח.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="font-bold">לא צריך להירשם</strong> - אין סיסמה, אין חשבון.
                אנחנו רק מבקשים את פרטי העסק כדי שהלקוחות יוכלו ליצור איתכם קשר.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="font-bold">אישור מהיר</strong> - בודקים שהפרטים תקינים
                ושהעסק מאזור הצפון. ברוב המקרים תוך יום אחד העסק שלכם חי באתר.
              </div>
            </div>
          </div>
        </header>

        {/* Form */}
        <RegistrationForm categories={categories} towns={towns} />
      </div>
    </div>
  );
}

function Step({ num, title, text }: { num: number; title: string; text: string }) {
  return (
    <div className="rounded-xl bg-white border p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm mb-3">
        {num}
      </div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
