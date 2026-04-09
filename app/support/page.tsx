import type { Metadata } from "next";
import Link from "next/link";
import { Heart, ArrowLeft, ExternalLink, Sparkles, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "תמיכה במיזם",
  description:
    "תומכים בצפון - קונים נכון. פרויקט קהילתי עצמאי. עזרו לנו להחזיק את האתר באוויר ולהמשיך לתמוך בעסקי הצפון.",
};

const DONATE_URL = "https://mrng.to/srgVQ0p8ss";

export default function SupportPage() {
  return (
    <div className="container-page py-12 sm:py-16 max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-sm font-medium text-primary mb-5">
          <Heart className="h-4 w-4" fill="currentColor" />
          <span>תמיכה במיזם</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
          רוצים לעזור למיזם הזה
          <br />
          <span className="text-primary">להמשיך להיות באוויר?</span>
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed">
          המיזם הזה הוא קהילתי וללא מטרות רווח, אבל הוא לא חינם להחזיק באוויר.
        </p>
      </div>

      {/* Personal note */}
      <section className="not-prose mb-10 rounded-2xl border-2 border-accent/30 bg-gradient-to-bl from-accent-soft via-white to-primary-soft/30 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
          <MapPin className="h-3.5 w-3.5" />
          <span>שלום, אני שחר מקריית שמונה</span>
        </div>

        <div className="space-y-4 text-foreground/90 leading-relaxed">
          <p>
            אני <strong>תושב קריית שמונה</strong>, וגם לי יש עסק שנפגע מהמלחמה — עמדת
            צילום AI לאירועים. ב-1 במרץ כל האירועים שלי למרץ ולפורים בוטלו, וכבר חודש
            וקצת אני בלי הכנסה מהעסק.
          </p>
          <p>
            הקמתי את האתר הזה בדיוק בגלל זה. כי אני יודע מה זה לראות שנים של עבודה
            מתמוטטות בתוך יום, ואני יודע שאני לא לבד — אלפי בעלי עסקים בצפון נמצאים
            בדיוק במקום הזה. רציתי לבנות משהו <strong>שיעזור גם להם, לא רק לי</strong>{" "}
            — מקום אחד שבו לקוחות מכל הארץ יוכלו למצוא בעלי מקצוע מהצפון ולהזמין מהם
            ישירות, בלי מתווכים.
          </p>
        </div>
      </section>

      {/* Why it costs money */}
      <section className="prose prose-lg max-w-none mb-10 space-y-6 text-foreground">
        <p className="leading-relaxed text-foreground/90">
          האתר הזה צובר עלויות קבועות — שרתים, אחסון, רוחב פס, שמות מתחם, כלי AI
          לחיפוש ולפיתוח, וכל התשתית שמאפשרת לעשרות אלפי אנשים להגיע לעסקים מהצפון
          בלי לשלם אגורה.
        </p>
        <p className="leading-relaxed text-foreground/90">
          <strong>בינתיים אני מממן את הכל מהכיס הפרטי שלי</strong> — בשמחה, כי זה חשוב
          לי. אבל ככל שהאתר גדל ועוד עסקים מצטרפים, העלויות גדלות איתו. כל תרומה —
          קטנה כגדולה — עוזרת לי להמשיך להחזיק את המיזם באוויר ולהשקיע בו זמן ופיתוח.
        </p>
        <p className="leading-relaxed text-foreground/90">
          אם המיזם הזה מדבר אליכם, אם השתמשתם בו כדי למצוא בעל עסק מהצפון, אם הוא עזר
          לכם להזמין משהו ממקומי במקום מרשת — אתם מוזמנים לתרום סכום סמלי. <strong>כל
          תרומה, באשר היא, מתקבלת בהערכה עמוקה.</strong>
        </p>
      </section>

      {/* Donate CTA card */}
      <section className="not-prose mb-12 rounded-2xl bg-gradient-to-bl from-primary-soft via-white to-accent-soft p-8 sm:p-10 border border-primary/20 shadow-sm text-center">
        <Heart
          className="h-12 w-12 mx-auto mb-4 text-primary"
          fill="currentColor"
        />
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          כל תרומה עוזרת
        </h2>
        <p className="text-muted-foreground mb-7 max-w-lg mx-auto">
          לא משנה אם זה 10₪ או 100₪ — כל סכום נכנס ישר לתחזוקת האתר ולפיתוחו.
          התשלום מאובטח דרך פלטפורמת Morning.
        </p>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Heart className="h-5 w-5" fill="currentColor" />
          לתרומה למיזם
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-4 text-xs text-muted-foreground">
          תועברו לדף תרומה מאובטח של Morning
        </p>
      </section>

      {/* Thank you / appreciation */}
      <section className="rounded-2xl border bg-card p-6 sm:p-8 mb-10">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">תודה ענקית</h3>
            <p className="text-foreground/90 leading-relaxed">
              עצם זה שאתם קוראים את השורות האלה זאת כבר תמיכה. גם שיתוף האתר עם חברים
              ומשפחה, גם הזמנה אחת מבעל עסק מהצפון — כל פעולה קטנה מצטרפת למשהו גדול.
              תודה שאתם איתנו במסע הזה.
            </p>
          </div>
        </div>
      </section>

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לרשימת העסקים
      </Link>
    </div>
  );
}
