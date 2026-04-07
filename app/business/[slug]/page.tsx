import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Clock,
  ExternalLink,
  ArrowRight,
  Heart,
  User,
} from "lucide-react";
import { getApprovedBusinesses } from "@/lib/firebase-admin";
import { formatPhone, telLink, whatsappLink } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const businesses = await getApprovedBusinesses();
  return businesses.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const businesses = await getApprovedBusinesses();
  const business = businesses.find((b) => b.slug === slug);

  if (!business) {
    return { title: "עסק לא נמצא" };
  }

  const description =
    business.shortDescription ||
    business.description.slice(0, 160) +
      (business.description.length > 160 ? "..." : "");

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
  const businesses = await getApprovedBusinesses();
  const business = businesses.find((b) => b.slug === slug);

  if (!business) {
    notFound();
  }

  const waMessage = `שלום! ראיתי את ${business.name} באתר "תומכים בצפון - קונים נכון" ואשמח ליצור קשר.`;

  // Schema.org LocalBusiness markup for SEO
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

      <article className="container-page py-8 sm:py-12 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לרשימה
        </Link>

        {/* Hero card */}
        <div className="rounded-2xl border bg-gradient-to-bl from-primary-soft via-white to-accent-soft p-6 sm:p-10 shadow-sm">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border text-xs font-medium text-primary mb-4 shadow-sm">
            {business.category}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {business.name}
          </h1>

          <div className="flex items-center gap-2 text-base text-muted-foreground mb-6">
            <MapPin className="h-5 w-5 text-primary/70" />
            <span>{business.town}</span>
            {business.address && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{business.address}</span>
              </>
            )}
          </div>

          <p className="text-lg text-foreground/90 leading-relaxed whitespace-pre-line">
            {business.description}
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={telLink(business.phone)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              <Phone className="h-5 w-5" />
              התקשרו: {formatPhone(business.phone)}
            </a>
            {(business.whatsapp || business.phone) && (
              <a
                href={whatsappLink(business.whatsapp || business.phone, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 font-bold text-white hover:opacity-90 transition shadow-sm"
              >
                <MessageCircle className="h-5 w-5" />
                שלחו הודעה בוואטסאפ
              </a>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <DetailCard title="פרטי קשר" icon={<User className="h-5 w-5" />}>
            <DetailRow icon={<User className="h-4 w-4" />} label="איש קשר">
              {business.contactName}
            </DetailRow>
            <DetailRow icon={<Phone className="h-4 w-4" />} label="טלפון">
              <a href={telLink(business.phone)} className="hover:text-primary" dir="ltr">
                {formatPhone(business.phone)}
              </a>
            </DetailRow>
            {business.email && (
              <DetailRow icon={<Mail className="h-4 w-4" />} label="אימייל">
                <a href={`mailto:${business.email}`} className="hover:text-primary break-all">
                  {business.email}
                </a>
              </DetailRow>
            )}
            {business.website && (
              <DetailRow icon={<Globe className="h-4 w-4" />} label="אתר">
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary break-all"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              </DetailRow>
            )}
          </DetailCard>

          {(business.openingHours || business.facebook || business.instagram) && (
            <DetailCard title="מידע נוסף" icon={<Clock className="h-5 w-5" />}>
              {business.openingHours && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label="שעות פעילות">
                  <span className="whitespace-pre-line">{business.openingHours}</span>
                </DetailRow>
              )}
              {business.facebook && (
                <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="פייסבוק">
                  <a
                    href={business.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    דף הפייסבוק
                  </a>
                </DetailRow>
              )}
              {business.instagram && (
                <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="אינסטגרם">
                  <a
                    href={business.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    דף האינסטגרם
                  </a>
                </DetailRow>
              )}
            </DetailCard>
          )}
        </div>

        {/* Support banner */}
        <div className="mt-10 rounded-2xl bg-primary text-primary-foreground p-6 sm:p-8 text-center">
          <Heart className="h-8 w-8 mx-auto mb-3" fill="currentColor" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            כל הזמנה מ{business.name} = תמיכה ישירה בצפון
          </h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto">
            עסק זה מאזור שנפגע מהמלחמה. ההזמנה שלכם עוזרת לבעל העסק להמשיך לעבוד ולשרת את
            האזור. תודה שאתם איתנו.
          </p>
        </div>
      </article>
    </>
  );
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-foreground font-medium">{children}</div>
      </div>
    </div>
  );
}
