import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zafon-biz.web.app"),
  title: {
    default: "תומכים בצפון - קונים נכון | אינדקס עסקים מהצפון",
    template: "%s | תומכים בצפון - קונים נכון",
  },
  description:
    "אינדקס עסקים מקריית שמונה, אצבע הגליל ויישובי קו העימות. תמכו בעסקי הצפון שנפגעו מהמלחמה - חפשו בעלי מקצוע ושירותים מהאזור והזמינו מהם עבודה.",
  keywords: [
    "עסקים בצפון",
    "קריית שמונה",
    "אצבע הגליל",
    "קו העימות",
    "תמיכה בצפון",
    "בעלי מקצוע צפון",
    "תושבי הצפון",
    "אינדקס עסקים",
  ],
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "תומכים בצפון - קונים נכון",
    title: "תומכים בצפון - קונים נכון | אינדקס עסקים מהצפון",
    description:
      "אינדקס עסקים מקריית שמונה ויישובי קו העימות. תמכו בצפון - הזמינו מבעלי מקצוע מהאזור שנפגע.",
  },
  twitter: {
    card: "summary_large_image",
    title: "תומכים בצפון - קונים נכון",
    description: "אינדקס עסקים מהצפון לתמיכה בעסקי קו העימות",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
