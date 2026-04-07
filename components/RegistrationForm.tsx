"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Send, AlertCircle } from "lucide-react";
import {
  businessRegistrationSchema,
  type BusinessRegistrationInput,
} from "@/lib/validation";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";
import type { Category, Town } from "@/lib/types";

interface RegistrationFormProps {
  categories: Category[];
  towns: Town[];
}

export function RegistrationForm({ categories, towns }: RegistrationFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessRegistrationInput>({
    resolver: zodResolver(businessRegistrationSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      town: "",
      contactName: "",
      phone: "",
      address: "",
      whatsapp: "",
      email: "",
      website: "",
      openingHours: "",
      facebook: "",
      instagram: "",
      website_url_confirm: "",
    },
  });

  async function onSubmit(data: BusinessRegistrationInput) {
    setSubmitError(null);

    // Honeypot check - if a bot filled this hidden field, abort
    if (data.website_url_confirm) {
      setSubmitError("שגיאה בשליחה. אנא נסו שוב.");
      return;
    }

    try {
      const baseSlug = slugify(data.name);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
      const shuffleSeed = Math.floor(Math.random() * 1_000_000_000);

      // Build payload, dropping empty optional fields and the honeypot
      const payload: Record<string, unknown> = {
        status: "pending",
        name: data.name.trim(),
        slug: uniqueSlug,
        description: data.description.trim(),
        category: data.category,
        town: data.town,
        contactName: data.contactName.trim(),
        phone: data.phone.trim(),
        createdAt: serverTimestamp(),
        shuffleSeed,
      };

      const optionalFields = [
        "address",
        "whatsapp",
        "email",
        "website",
        "openingHours",
        "facebook",
        "instagram",
      ] as const;

      for (const key of optionalFields) {
        const value = data[key];
        if (typeof value === "string" && value.trim().length > 0) {
          payload[key] = value.trim();
        }
      }

      await addDoc(collection(db, "businesses"), payload);
      router.push("/thank-you/");
    } catch (err) {
      console.error("Failed to submit business:", err);
      setSubmitError(
        "שגיאה בשליחת הטופס. אנא נסו שוב, ואם הבעיה ממשיכה - שלחו לנו אימייל.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative rounded-2xl border bg-white p-6 sm:p-8 shadow-sm space-y-5 overflow-hidden"
    >
      <h2 className="text-xl font-bold text-foreground mb-2">פרטי העסק</h2>

      <Field label="שם העסק" required error={errors.name?.message}>
        <input
          {...register("name")}
          type="text"
          placeholder="לדוגמה: מאפיית הר ארץ"
          className={inputClass(errors.name)}
        />
      </Field>

      <Field
        label="תיאור העסק"
        required
        error={errors.description?.message}
        hint="20-800 תווים. מה אתם עושים? למה כדאי להזמין מכם?"
      >
        <textarea
          {...register("description")}
          rows={4}
          placeholder="תארו את העסק שלכם, את המוצרים או השירותים שאתם מציעים, ומה הופך אתכם לייחודיים..."
          className={inputClass(errors.description, "resize-none")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="תחום עיסוק" required error={errors.category?.message}>
          <select {...register("category")} className={inputClass(errors.category)}>
            <option value="">בחרו תחום</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="יישוב" required error={errors.town?.message}>
          <select {...register("town")} className={inputClass(errors.town)}>
            <option value="">בחרו יישוב</option>
            {towns.map((town) => (
              <option key={town.id} value={town.name}>
                {town.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="כתובת מלאה"
        error={errors.address?.message}
        hint="אופציונלי - אם יש לעסק מיקום פיזי שלקוחות יכולים להגיע אליו"
      >
        <input
          {...register("address")}
          type="text"
          placeholder="לדוגמה: רחוב הרצל 12, קריית שמונה"
          className={inputClass(errors.address)}
        />
      </Field>

      <hr className="border-t" />
      <h2 className="text-xl font-bold text-foreground mb-2">איש קשר</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="שם איש הקשר" required error={errors.contactName?.message}>
          <input
            {...register("contactName")}
            type="text"
            placeholder="ישראל ישראלי"
            className={inputClass(errors.contactName)}
          />
        </Field>

        <Field
          label="טלפון"
          required
          error={errors.phone?.message}
          hint="לדוגמה: 054-1234567"
        >
          <input
            {...register("phone")}
            type="tel"
            placeholder="054-1234567"
            dir="ltr"
            className={inputClass(errors.phone)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="וואטסאפ"
          error={errors.whatsapp?.message}
          hint="אם שונה ממספר הטלפון"
        >
          <input
            {...register("whatsapp")}
            type="tel"
            placeholder="054-1234567"
            dir="ltr"
            className={inputClass(errors.whatsapp)}
          />
        </Field>

        <Field label="אימייל" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            placeholder="business@example.com"
            dir="ltr"
            className={inputClass(errors.email)}
          />
        </Field>
      </div>

      <Field label="אתר אינטרנט" error={errors.website?.message}>
        <input
          {...register("website")}
          type="url"
          placeholder="https://example.com"
          dir="ltr"
          className={inputClass(errors.website)}
        />
      </Field>

      <Field
        label="שעות פעילות"
        error={errors.openingHours?.message}
        hint="לדוגמה: א-ה 09:00-18:00, ו 09:00-13:00"
      >
        <input
          {...register("openingHours")}
          type="text"
          placeholder="א-ה 09:00-18:00"
          className={inputClass(errors.openingHours)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="קישור לפייסבוק" error={errors.facebook?.message}>
          <input
            {...register("facebook")}
            type="url"
            placeholder="https://facebook.com/..."
            dir="ltr"
            className={inputClass(errors.facebook)}
          />
        </Field>

        <Field label="קישור לאינסטגרם" error={errors.instagram?.message}>
          <input
            {...register("instagram")}
            type="url"
            placeholder="https://instagram.com/..."
            dir="ltr"
            className={inputClass(errors.instagram)}
          />
        </Field>
      </div>

      {/* Honeypot - visually hidden but present in DOM. Bots that fill all
          inputs will trip this; real users won't see or tab to it. We use
          clip+absolute (sr-only style) so it doesn't expand the layout in
          either LTR or RTL. */}
      <div
        aria-hidden="true"
        className="absolute w-px h-px overflow-hidden"
        style={{
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          top: 0,
          right: 0,
        }}
      >
        <label htmlFor="website_url_confirm">השאירו ריק</label>
        <input
          {...register("website_url_confirm")}
          id="website_url_confirm"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            שלחו את הבקשה
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        שדות עם * הם חובה. הפרטים יישלחו לבדיקה ולאחר אישור יופיע העסק באתר.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(error: unknown, extra = "") {
  return `w-full h-11 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${
    error ? "border-destructive" : "border-input"
  } ${extra}`;
}
