import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Users, Sparkles, ArrowLeft, GraduationCap, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "אודות הפרויקט",
  description:
    "תומכים בצפון - קונים נכון. פרויקט קהילתי לתמיכה בעסקי קריית שמונה, אצבע הגליל ויישובי קו העימות שנפגעו מהמלחמה.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-12 sm:py-16 max-w-3xl">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-sm font-medium text-primary mb-5">
          <Heart className="h-4 w-4" fill="currentColor" />
          <span>על הפרויקט</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
          תומכים בצפון
          <br />
          <span className="text-primary">קונים נכון</span>
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed">
          הפרויקט הזה הוא יוזמה קהילתית - אינדקס פתוח, חינמי, של עסקים מאזורי הצפון
          שנפגעו כלכלית מהמלחמה.
        </p>
      </div>

      <section className="prose prose-lg max-w-none mb-12 space-y-6 text-foreground">
        <h2 className="text-2xl font-bold mt-10">למה?</h2>
        <p className="leading-relaxed text-foreground/90">
          המלחמה הרב-חזיתית של ישראל פגעה בצורה קשה בעסקים של כל יישובי קו העימות -
          קריית שמונה, מטולה, מסעדה, מג'דל שמס, יישובי אצבע הגליל ורמת הגולן. רבים מבעלי
          העסקים פונו, איבדו לקוחות, ואחרים ראו את הכנסותיהם נחתכות.
        </p>
        <p className="leading-relaxed text-foreground/90">
          בעלי העסקים האלה לא צריכים צדקה. הם צריכים <strong>לקוחות</strong>. הם בעלי
          מקצוע מצוינים, יש להם מוצרים נהדרים, והם רוצים לעבוד. כל הזמנה - של חבילת קפה,
          של מטבח, של אירוח, של עיצוב גרפי - היא תמיכה אמיתית בכלכלה של האזור.
        </p>

        <h2 className="text-2xl font-bold mt-10">איך זה עובד?</h2>
        <ul className="space-y-3 text-foreground/90">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            <span>
              <strong>בעלי עסקים מהצפון</strong> נרשמים בחינם דרך טופס פשוט - ללא צורך
              בחשבון או סיסמה.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            <span>
              <strong>אנחנו בודקים</strong> את הפרטים ומוודאים שהעסק אכן מהאזור.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            <span>
              <strong>הלקוחות מכל הארץ</strong> נכנסים לאתר, מחפשים בעלי מקצוע ושירותים
              לפי תחום ויישוב, ויוצרים קשר ישיר עם בעל העסק.
            </span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-10">למה הוגן?</h2>
        <p className="leading-relaxed text-foreground/90">
          באתר הזה אין "תוצאה ראשונה" קבועה. סדר העסקים בדף הבית{" "}
          <strong>משתנה כל יום</strong> בצורה אוטומטית - כך שכל עסק מקבל הזדמנות שווה
          להופיע למעלה. אין תשלום כדי להופיע ראשון, אין רשימת מומלצים מוסתרת. כולם שווים.
        </p>

        <h2 className="text-2xl font-bold mt-10">מי עומד מאחורי הפרויקט?</h2>
        <p className="leading-relaxed text-foreground/90">
          הפרויקט הוקם על-ידי <strong>שחר גולן</strong>, בעל עסק בקריית שמונה שנפגע בעצמו
          מהמלחמה. שחר הוא מפתח ומרצה לבינה מלאכותית, והאתר הזה הוא היוזמה שלו לתת לכל
          העסקים באזור הצפון פלטפורמה אחת חזקה - כי בלי קצת תמיכה מהארץ, הצפון ייקח עוד
          הרבה זמן להתאושש.
        </p>
        <p className="leading-relaxed text-foreground/90">
          זה לא עסק. אין כאן עמלות, אין פרסומות, אין מודלים סודיים. רק רצון להחזיר עסקים
          שעבדו קשה כל החיים לאן שהם צריכים להיות - בתוך הכלכלה הישראלית, פעילים, מצליחים.
        </p>
      </section>

      {/* Private AI lessons callout */}
      <section className="not-prose mb-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-bl from-primary-soft via-white to-accent-soft/40 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              רוצים ללמוד AI עם שחר?
            </h2>
            <p className="text-foreground/85 leading-relaxed mb-4">
              שחר הוא מרצה לבינה מלאכותית ומפתח, ומעביר{" "}
              <strong>שיעורים פרטיים בזום</strong> אחד-על-אחד למי שרוצה ללמוד AI מאפס
              או להעמיק בנושא ספציפי. שלושת התחומים העיקריים שהוא מלמד:
            </p>
            <ul className="space-y-2 mb-5 text-foreground/85">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>פיתוח אתרים בעזרת AI</strong> — בניית אתרים ואפליקציות מודרניות
                  עם כלי AI כמו Claude Code, גם למי שלא יודע לתכנת
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>יצירת תמונות ב-AI</strong> — שליטה ב-Midjourney,
                  ChatGPT/DALL-E, Replicate, Nano Banana, gpt-image וכלים נוספים
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>יצירת וידאו ב-AI</strong> — Sora, Runway, Kling, Veo וכלים
                  נוספים ליצירת סרטונים מקצועיים מטקסט או מתמונות
                </span>
              </li>
            </ul>
            <a
              href="mailto:sgolan20@gmail.com?subject=שיעור פרטי ב-AI"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              להזמנת שיעור — sgolan20@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* CTA cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <Link
          href="/"
          className="rounded-2xl bg-primary text-primary-foreground p-6 hover:bg-primary/90 transition group"
        >
          <Users className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-bold mb-1">חפשו עסק</h3>
          <p className="text-sm text-primary-foreground/90 mb-3">
            מחפשים שירות או מוצר? חפשו לפי תחום או יישוב.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            לרשימת העסקים
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </Link>

        <Link
          href="/register/"
          className="rounded-2xl bg-accent text-accent-foreground p-6 hover:bg-accent/90 transition group"
        >
          <Sparkles className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-bold mb-1">הוסיפו עסק</h3>
          <p className="text-sm text-accent-foreground/90 mb-3">
            יש לכם עסק בצפון? הצטרפו חינם תוך 2 דקות.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            לטופס ההרשמה
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </Link>
      </div>

      {/* Region badge */}
      <div className="rounded-xl border bg-card p-5 flex items-start gap-3">
        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">לאילו אזורים זה מתאים?</strong> כל יישובי
          הצפון שנפגעו: קריית שמונה, מטולה, מרגליות, מנרה, מלכיה, יראון, כפר גלעדי,
          דפנה, דן, מסעדה, מג'דל שמס, בוקעאתא, עין קיניה, ראש פינה, חצור הגלילית, ושאר
          יישובי אצבע הגליל ורמת הגולן הצפונית.
        </div>
      </div>
    </div>
  );
}
