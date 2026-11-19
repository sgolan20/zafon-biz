"use client";

/**
 * Single-page edit form for a business — used by the owner's account area
 * (PUT /api/account/businesses/:id) and the admin panel
 * (PATCH /api/admin/businesses/:id with { fields }).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { businessFieldsSchema } from "@/lib/validation";
import type { Business, Category, Town } from "@/lib/types";
import { ErrorBox, SuccessBox } from "@/components/auth/AuthForms";
import type { z } from "zod";

type Fields = z.infer<typeof businessFieldsSchema>;

type FieldDef = {
  key: keyof Fields;
  label: string;
  required?: boolean;
  type?: "text" | "textarea" | "tel" | "email" | "category" | "town";
  ltr?: boolean;
  hint?: string;
};

const FIELDS: FieldDef[] = [
  { key: "name", label: "שם העסק", required: true },
  { key: "category", label: "תחום", required: true, type: "category" },
  { key: "town", label: "יישוב", required: true, type: "town" },
  { key: "description", label: "תיאור העסק", required: true, type: "textarea" },
  { key: "contactName", label: "איש קשר", required: true },
  { key: "phone", label: "טלפון", required: true, type: "tel", ltr: true },
  { key: "whatsapp", label: "וואטסאפ", type: "tel", ltr: true },
  { key: "email", label: "אימייל של העסק", type: "email", ltr: true },
  { key: "website", label: "אתר אינטרנט", ltr: true },
  { key: "address", label: "כתובת" },
  { key: "openingHours", label: "שעות פעילות" },
  { key: "facebook", label: "פייסבוק", ltr: true },
  { key: "instagram", label: "אינסטגרם", ltr: true },
];

export function BusinessEditForm({
  business,
  categories,
  towns,
  mode,
  backHref,
}: {
  business: Business;
  categories: Category[];
  towns: Town[];
  mode: "owner" | "admin";
  backHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(businessFieldsSchema),
    defaultValues: {
      name: business.name,
      description: business.description,
      category: business.category,
      town: business.town,
      contactName: business.contactName,
      phone: business.phone,
      whatsapp: business.whatsapp ?? "",
      email: business.email ?? "",
      website: business.website ?? "",
      address: business.address ?? "",
      openingHours: business.openingHours ?? "",
      facebook: business.facebook ?? "",
      instagram: business.instagram ?? "",
    },
  });

  async function onSubmit(fields: Fields) {
    setError(null);
    setSaved(false);
    const res =
      mode === "owner"
        ? await fetch(`/api/account/businesses/${business.id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fields),
          })
        : await fetch(`/api/admin/businesses/${business.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields }),
          });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "השמירה נכשלה");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const inputBase =
    "w-full px-3 rounded-lg border bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

  // Keep values that are no longer in the lists selectable.
  const categoryNames = categories.map((c) => c.name);
  if (!categoryNames.includes(business.category)) categoryNames.unshift(business.category);
  const townNames = towns.map((t) => t.name);
  if (!townNames.includes(business.town)) townNames.unshift(business.town);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const err = errors[f.key]?.message as string | undefined;
          const cls = `${inputBase} ${err ? "border-destructive" : "border-input"}`;
          const wide = f.type === "textarea" || f.key === "name";
          return (
            <label key={f.key} className={`block ${wide ? "sm:col-span-2" : ""}`}>
              <span className="block text-sm font-medium text-foreground mb-1">
                {f.label}
                {f.required && <span className="text-destructive mr-1">*</span>}
              </span>
              {f.type === "textarea" ? (
                <textarea {...register(f.key)} rows={6} className={`${cls} py-2 resize-y`} />
              ) : f.type === "category" ? (
                <select {...register(f.key)} className={`${cls} h-11`}>
                  {categoryNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              ) : f.type === "town" ? (
                <select {...register(f.key)} className={`${cls} h-11`}>
                  {townNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...register(f.key)}
                  type={f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"}
                  dir={f.ltr ? "ltr" : undefined}
                  className={`${cls} h-11`}
                />
              )}
              {f.key === "email" && mode === "admin" && (
                <span className="block text-xs text-muted-foreground mt-1">
                  האימייל הזה הוא גם חשבון הכניסה של בעל העסק.
                </span>
              )}
              {err && <span className="block text-xs text-destructive mt-1">{err}</span>}
            </label>
          );
        })}
      </div>

      <ErrorBox message={error} />
      {saved && (
        <SuccessBox>
          הפרטים נשמרו
          {business.status === "approved" ? " ומופיעים כבר באתר." : "."}
        </SuccessBox>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition shadow-sm"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          שמירה
        </button>
        <a href={backHref} className="text-sm text-muted-foreground hover:text-primary">
          חזרה
        </a>
      </div>
    </form>
  );
}
