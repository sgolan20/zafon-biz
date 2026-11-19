import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Clock,
  Heart,
  User,
  Navigation,
} from "lucide-react";
import { getApprovedBusinesses, getBusinessBySlug } from "@/lib/db";
import { formatPhone, telLink, whatsappLink } from "@/lib/utils";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";
import { FavoriteButton } from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(decodeURIComponent(slug));
  if (!business) return { title: "עסק לא נמצא" };

  const description =
    business.shortDescription ||
    business.description.slice(0, 160) + (business.description.length > 160 ? "..." : "");

  return {
    title: `${business.name} - ${business.town}`,
    description,
    openGraph: {
      title: `${business.name} | תומכים בצפון`,
      description,
      type: "website",
    },
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(decodeURIComponent(slug));
  if (!business) notFound();

  // Three more businesses from the same category, rotating daily.
  const sameCategory = (await getApprovedBusinesses()).filter(
    (b) => b.category === business.category && b.id !== business.id,
  );
  const more = shuffleWithSeed(sameCategory, getTodayIsraelSeed()).slice(0, 3);

  const waMessage = `שלום! ראיתי את ${business.name} באתר "תומכים בצפון - קונים נכון" ואשמח ליצור קשר.`;
  const wazeQuery = [business.address, business.town].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    telephone: business.phone,
    email: business.email,
    url: business.website,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.town,
      addressCountry: "IL",
      streetAddress: business.address,
    },
    areaServed: business.town,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover */}
      <section className="relative h-[240px] sm:h-[340px] bg-primary">
        <Image
          src="/images/v2/hero2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[rgba(14,32,24,0.78)] to-[rgba(14,32,24,0.05)]"
        />
        <div className="container-page relative flex h-full items-end pb-16 sm:pb-20">
          <nav aria-label="פירורי לחם" className="flex flex-wrap items-center gap-2 text-sm text-[#e8e2d4]">
            <Link href="/" className="text-white hover:underline">
              כל העסקים
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/?cat=${encodeURIComponent(business.category)}#businesses`}
              className="text-white hover:underline"
            >
              {business.category}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{business.name}</span>
          </nav>
        </div>
      </section>

      <div className="container-page relative -mt-10 pb-20">
        <div className="grid gap-6 lg:gap-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start">
          {/* Main */}
          <div className="flex flex-col gap-6">
            <article className="flex flex-col gap-5 sm:gap-6 rounded-3xl bg-white p-6 sm:p-10 shadow-[0_24px_60px_rgba(16,35,26,0.1)]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-[#f3efe6] px-3 py-1.5 text-sm font-bold text-primary">
                  {business.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[15px] text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {business.town}
                  {business.address && ` · ${business.address}`}
                </span>
              </div>

              <h1 className="text-[34px] sm:text-[52px] leading-[1.05] font-black tracking-tight">
                {business.name}
              </h1>

              <p className="text-lg sm:text-[19px] leading-[1.75] text-[#2f3b34] whitespace-pre-line">
                {business.description}
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href={telLink(business.phone)}
                  className="inline-flex items-center gap-2.5 min-h-[54px] rounded-[14px] bg-primary px-6 text-[17px] font-extrabold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span dir="ltr">{formatPhone(business.phone)}</span>
                </a>
                <a
                  href={whatsappLink(business.whatsapp || business.phone, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 min-h-[54px] rounded-[14px] bg-[#1e8c4e] px-6 text-[17px] font-extrabold text-white hover:opacity-90 transition"
                >
                  <MessageCircle className="h-5 w-5" />
                  שלחו הודעה בוואטסאפ
                </a>
                <FavoriteButton businessId={business.id} businessName={business.name} />
              </div>
            </article>

            <div className="flex items-center gap-4 sm:gap-5 rounded-[20px] bg-ink px-6 sm:px-8 py-6 text-white">
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-accent">
                <Heart className="h-6 w-6 text-accent-foreground" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-lg sm:text-[19px] font-extrabold">
                  כל הזמנה מ{business.name} היא תמיכה ישירה בצפון
                </span>
                <span className="text-[15px] text-[#cfd6d0]">
                  העסק פועל באזור שנפגע מהמלחמה. תודה שאתם קונים מקומי.
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            <div className="flex flex-col gap-4.5 rounded-[22px] border border-[#eae3d5] bg-white p-6 sm:p-7">
              <h2 className="text-xl font-extrabold">פרטי קשר</h2>
              <Detail icon={<User className="h-[18px] w-[18px]" />} label="איש קשר">
                {business.contactName}
              </Detail>
              <Detail icon={<Phone className="h-[18px] w-[18px]" />} label="טלפון">
                <a href={telLink(business.phone)} dir="ltr" className="hover:text-primary">
                  {formatPhone(business.phone)}
                </a>
              </Detail>
              {business.email && (
                <Detail icon={<Mail className="h-[18px] w-[18px]" />} label="אימייל">
                  <a href={`mailto:${business.email}`} className="break-all hover:text-primary">
                    {business.email}
                  </a>
                </Detail>
              )}
              {business.website && (
                <Detail icon={<Globe className="h-[18px] w-[18px]" />} label="אתר">
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all hover:text-primary"
                  >
                    {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </Detail>
              )}
              {business.openingHours && (
                <Detail icon={<Clock className="h-[18px] w-[18px]" />} label="שעות פעילות">
                  <span className="whitespace-pre-line">{business.openingHours}</span>
                </Detail>
              )}

              <div className="flex flex-wrap gap-2.5 border-t border-[#f0eadf] pt-4">
                {business.facebook && <SmallLink href={business.facebook}>פייסבוק</SmallLink>}
                {business.instagram && <SmallLink href={business.instagram}>אינסטגרם</SmallLink>}
                <SmallLink href={`https://waze.com/ul?q=${encodeURIComponent(wazeQuery)}`}>
                  <Navigation className="h-4 w-4" />
                  ניווט ב-Waze
                </SmallLink>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[22px] bg-muted p-6 sm:p-7">
              <span className="font-extrabold">זה העסק שלכם?</span>
              <span className="text-[15px] leading-relaxed text-[#3e4a43]">
                היכנסו לאזור האישי עם המייל של העסק כדי לעדכן פרטים, שעות ותיאור.
              </span>
              <Link href="/account/" className="mt-1 w-fit font-bold text-primary hover:underline">
                לאזור האישי ←
              </Link>
            </div>
          </aside>
        </div>

        {more.length > 0 && (
          <section className="mt-16 sm:mt-20 flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-[32px] font-extrabold tracking-tight">
                עוד ב{business.category}
              </h2>
              <Link
                href={`/?cat=${encodeURIComponent(business.category)}#businesses`}
                className="font-bold text-primary hover:underline"
              >
                לכל {sameCategory.length + 1} העסקים בתחום
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {more.map((b) => (
                <Link
                  key={b.id}
                  href={`/business/${b.slug}/`}
                  className="flex flex-col gap-2.5 rounded-[20px] border border-[#eae3d5] bg-white p-6 hover:shadow-[0_16px_40px_rgba(16,35,26,0.1)] transition-shadow"
                >
                  <span className="text-[19px] font-extrabold">{b.name}</span>
                  <span className="text-sm text-muted-foreground">{b.town}</span>
                  <span className="text-[15px] leading-relaxed text-[#3e4a43] line-clamp-3">
                    {b.shortDescription || b.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3efe6] text-primary">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="text-base font-semibold">{children}</span>
      </div>
    </div>
  );
}

function SmallLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-1 items-center justify-center gap-1.5 min-h-11 rounded-xl border border-border px-3 text-[15px] font-semibold hover:bg-muted transition-colors whitespace-nowrap"
    >
      {children}
    </a>
  );
}
