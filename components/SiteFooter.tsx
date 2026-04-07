import Link from "next/link";
import { Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white mt-16">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Heart className="h-4 w-4" fill="currentColor" />
              </div>
              <div className="leading-tight">
                <div className="font-bold">תומכים בצפון</div>
                <div className="text-xs text-muted-foreground">קונים נכון</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              אינדקס עסקים מקריית שמונה, אצבע הגליל ויישובי קו העימות. תמכו בעסקי הצפון
              שנפגעו מהמלחמה - הזמינו מבעלי מקצוע מהאזור.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-3">ניווט</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  עמוד הבית
                </Link>
              </li>
              <li>
                <Link href="/about/" className="text-muted-foreground hover:text-primary">
                  אודות הפרויקט
                </Link>
              </li>
              <li>
                <Link href="/register/" className="text-muted-foreground hover:text-primary">
                  הוספת עסק
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-3">צרו קשר</h3>
            <p className="text-sm text-muted-foreground">
              יש לכם שאלה, תיקון או בקשה? אנחנו כאן.
            </p>
            <a
              href="mailto:sgolan20@gmail.com"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              sgolan20@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} תומכים בצפון - קונים נכון. כל הזכויות שמורות.
          </p>
          <p className="mt-1">
            פרויקט קהילתי ללא מטרות רווח לתמיכה בעסקי הצפון.
          </p>
        </div>
      </div>
    </footer>
  );
}
