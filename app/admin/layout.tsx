import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ניהול",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-muted/30 min-h-full">{children}</div>;
}
