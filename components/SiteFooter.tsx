import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink-deep text-[#cfd6d0]">
      <div className="container-page pt-14 pb-10 flex flex-wrap justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-sm">
          <Link href="/" className="group w-fit">
            <Logo full />
          </Link>
          <p className="text-[15px] leading-relaxed">
            מיזם קהילתי ללא מטרות רווח, שמחבר בין תושבי הארץ לעסקים הקטנים של הגליל העליון,
            הגולן ויישובי קו העימות.
          </p>
        </div>

        <div className="flex flex-wrap gap-14">
          <FooterCol title="האתר">
            <FooterLink href="/#businesses">כל העסקים</FooterLink>
            <FooterLink href="/about/">אודות המיזם</FooterLink>
            <FooterLink href="/support/">תמיכה במיזם</FooterLink>
          </FooterCol>
          <FooterCol title="לבעלי עסקים">
            <FooterLink href="/register/">הוספת עסק</FooterLink>
            <FooterLink href="/login/">כניסה לאזור האישי</FooterLink>
            <FooterLink href="/forgot-password/">שכחתי סיסמה</FooterLink>
          </FooterCol>
          <FooterCol title="צרו קשר">
            <span className="text-[15px]">שאלה, תיקון או בקשה?</span>
            <a href="mailto:sgolan20@gmail.com" className="text-[15px] text-white hover:text-gold-text">
              sgolan20@gmail.com
            </a>
          </FooterCol>
        </div>
      </div>
      <div className="container-page py-6 border-t border-white/10 flex flex-wrap justify-between gap-2 text-[13px] text-[#9aa59e]">
        <span>© {new Date().getFullYear()} תומכים בצפון - קונים נכון</span>
        <span>נבנה באהבה בקריית שמונה</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-bold text-white">{title}</span>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[15px] hover:text-white transition-colors">
      {children}
    </Link>
  );
}
