import Link from "next/link";
import { Heart } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-foreground">תומכים בעורף</span>
            <span className="text-xs text-muted-foreground">קונים נכון</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            עסקים
          </Link>
          <Link
            href="/about/"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors hidden sm:inline-block"
          >
            אודות
          </Link>
          <Link
            href="/register/"
            className="rounded-md bg-accent px-3 sm:px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
          >
            הוסיפו עסק
          </Link>
        </nav>
      </div>
    </header>
  );
}
