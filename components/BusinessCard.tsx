import Link from "next/link";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
import type { BusinessSummary } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

interface BusinessCardProps {
  business: BusinessSummary;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <article className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/business/${business.slug}/`} className="before:absolute before:inset-0">
              {business.name}
            </Link>
          </h3>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-soft px-2 py-0.5 rounded-md">
            {business.category}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
        {business.shortDescription || business.description}
      </p>

      <div className="space-y-1.5 text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="truncate">{business.town}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="truncate" dir="ltr">
            {formatPhone(business.phone)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-primary relative z-10 pointer-events-none">
        <span>לדף העסק</span>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </article>
  );
}
