import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "תודה על ההרשמה",
  description: "פנייתכם התקבלה. אנחנו נבדוק את הפרטים תוך 24-48 שעות.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <div className="container-page py-16 sm:py-24 max-w-2xl text-center">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-success/10 text-success mb-6">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
        תודה רבה!
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed mb-2">
        קיבלנו את פרטי העסק שלכם. צוות הפרויקט יבדוק את הפרטים תוך
        <strong className="text-foreground"> 24-48 שעות</strong>, ולאחר האישור העסק יופיע
        באתר.
      </p>

      <p className="text-base text-muted-foreground mb-8">
        אם נצטרך פרטים נוספים, ניצור איתכם קשר במספר שהשארתם.
      </p>

      <div className="rounded-2xl bg-primary text-primary-foreground p-6 sm:p-8 mb-8">
        <Heart className="h-8 w-8 mx-auto mb-3" fill="currentColor" />
        <h2 className="text-xl font-bold mb-2">תודה שאתם איתנו</h2>
        <p className="text-primary-foreground/90">
          פרויקט "תומכים בצפון - קונים נכון" מתקיים בזכות בעלי עסקים כמוכם, שלא ויתרו על
          הצפון. ביחד נחזק את הכלכלה המקומית.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition"
      >
        חזרה לאתר
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
