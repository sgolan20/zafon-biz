"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, UserRound } from "lucide-react";
import { Logo } from "./Logo";

/**
 * Site header. On the home page it floats transparently over the video
 * hero; everywhere else it is a solid dark-green bar that sticks to the top.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const overlay = pathname === "/";

  return (
    <header
      className={
        overlay
          ? "absolute top-0 inset-x-0 z-40 w-full"
          : "sticky top-0 z-40 w-full bg-ink border-b border-white/10"
      }
    >
      <div className="container-page flex h-[76px] sm:h-[84px] items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="group">
          <Logo />
        </Link>

        <nav aria-label="ראשי" className="flex items-center gap-1 sm:gap-2">
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/#businesses">עסקים</NavLink>
            <NavLink href="/about/">אודות</NavLink>
            <Link
              href="/support/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Heart className="h-4 w-4 text-gold-text" fill="currentColor" />
              תמיכה במיזם
            </Link>
          </div>
          <Link
            href="/account/"
            aria-label="האזור האישי לבעלי עסקים"
            className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-3 sm:px-4 min-h-11 text-[15px] font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <UserRound className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">האזור שלי</span>
          </Link>
          <Link
            href="/register/"
            className="inline-flex items-center rounded-xl bg-accent px-3.5 sm:px-5 min-h-11 text-[15px] font-extrabold text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
          >
            הוסיפו עסק
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  );
}
