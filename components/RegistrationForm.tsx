"use client";

/* eslint-disable @next/next/no-img-element -- previews of picked files (blob URLs) */

/**
 * Multi-step business registration wizard.
 *
 * One question per step. Required steps block "next" until valid; optional
 * steps offer a "skip" button. The final step is a review screen showing
 * everything the user filled in, with edit links back to each step.
 *
 * Built on a single react-hook-form instance — `trigger(field)` is used to
 * validate just the current step's field before advancing.
 *
 * Visitors who aren't logged in get two extra steps (account email +
 * password) so the business owner can later log in and edit the listing.
 * Submits to POST /api/register, which re-validates everything.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Send,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Pencil,
  Search,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { shrinkImage } from "@/components/BusinessImagesEditor";
import {
  businessRegistrationSchema,
  type BusinessRegistrationInput,
} from "@/lib/validation";
import type { Category, Town } from "@/lib/types";

interface RegistrationFormProps {
  categories: Category[];
  towns: Town[];
  /** Email of the logged-in owner, or null for an anonymous visitor. */
  loggedInEmail: string | null;
}

type FieldKey = Exclude<
  keyof BusinessRegistrationInput,
  "website_url_confirm"
>;

/** Main photo / logo picked during registration, already shrunk to WebP. */
type PickedImage = { blob: Blob; preview: string };
type PickedImages = { cover?: PickedImage; logo?: PickedImage };

type StepDef = {
  /** "images" is the photo step — not a form field, kept in local state. */
  key: FieldKey | "images";
  required: boolean;
  question: string;
  hint?: string;
  placeholder?: string;
  type: "text" | "textarea" | "tel" | "email" | "url" | "category" | "town" | "password" | "images";
  inputMode?: "text" | "tel" | "email" | "url";
  ltr?: boolean;
};

const STEPS: StepDef[] = [
  {
    key: "name",
    required: true,
    question: "מה שם העסק שלכם?",
    hint: "השם שיוצג בדף העסק ובתוצאות החיפוש",
    placeholder: "לדוגמה: מאפיית הר ארץ",
    type: "text",
  },
  {
    key: "category",
    required: true,
    question: "באיזה תחום העסק עוסק?",
    hint: "בחרו את הקטגוריה הקרובה ביותר",
    type: "category",
  },
  {
    key: "town",
    required: true,
    question: "באיזה יישוב נמצא העסק?",
    hint: "התחילו להקליד כדי לסנן",
    type: "town",
  },
  {
    key: "description",
    required: true,
    question: "ספרו לנו על העסק שלכם",
    hint: "מה אתם עושים? מה הופך אתכם למיוחדים? (20-800 תווים)",
    placeholder:
      "תארו את העסק, את המוצרים או השירותים שאתם מציעים, ומה הופך אתכם לייחודיים...",
    type: "textarea",
  },
  {
    key: "images",
    required: false,
    question: "רוצים להוסיף תמונה ולוגו?",
    hint: "אופציונלי. עסק עם תמונה בולט הרבה יותר באינדקס. אפשר גם להוסיף אחר כך מהאזור האישי.",
    type: "images",
  },
  {
    key: "contactName",
    required: true,
    question: "מי איש הקשר?",
    hint: "השם של מי שיוצרים איתו קשר",
    placeholder: "ישראל ישראלי",
    type: "text",
  },
  {
    key: "phone",
    required: true,
    question: "מה מספר הטלפון?",
    hint: "המספר שלקוחות יחייגו אליו",
    placeholder: "054-1234567",
    type: "tel",
    inputMode: "tel",
    ltr: true,
  },
  {
    key: "whatsapp",
    required: false,
    question: "יש מספר וואטסאפ נפרד?",
    hint: "אופציונלי. אם הוואטסאפ זהה לטלפון - דלגו",
    placeholder: "054-1234567",
    type: "tel",
    inputMode: "tel",
    ltr: true,
  },
  {
    key: "email",
    required: false,
    question: "יש לכם כתובת אימייל לעסק?",
    hint: "אופציונלי",
    placeholder: "business@example.com",
    type: "email",
    inputMode: "email",
    ltr: true,
  },
  {
    key: "website",
    required: false,
    question: "יש לעסק אתר אינטרנט?",
    hint: "אופציונלי. אפשר פשוט הדומיין, למשל gogo.com",
    placeholder: "gogo.com",
    type: "url",
    inputMode: "url",
    ltr: true,
  },
  {
    key: "address",
    required: false,
    question: "יש לעסק כתובת פיזית?",
    hint: "אופציונלי. רק אם לקוחות מגיעים אליכם",
    placeholder: "רחוב הרצל 12, קריית שמונה",
    type: "text",
  },
  {
    key: "openingHours",
    required: false,
    question: "מה שעות הפעילות?",
    hint: "אופציונלי",
    placeholder: "א-ה 09:00-18:00, ו 09:00-13:00",
    type: "text",
  },
  {
    key: "facebook",
    required: false,
    question: "יש לעסק עמוד פייסבוק?",
    hint: "אופציונלי. הדביקו את הקישור או רק את הכתובת",
    placeholder: "facebook.com/your-page",
    type: "url",
    inputMode: "url",
    ltr: true,
  },
  {
    key: "instagram",
    required: false,
    question: "יש לעסק חשבון אינסטגרם?",
    hint: "אופציונלי. הדביקו את הקישור או רק את הכתובת",
    placeholder: "instagram.com/your-handle",
    type: "url",
    inputMode: "url",
    ltr: true,
  },
];

const ACCOUNT_STEPS: StepDef[] = [
  {
    key: "accountEmail",
    required: true,
    question: "באיזה אימייל תתחברו לאזור האישי?",
    hint: "איתו ועם הסיסמה תוכלו לעדכן את פרטי העסק בכל זמן",
    placeholder: "you@example.com",
    type: "email",
    inputMode: "email",
    ltr: true,
  },
  {
    key: "accountPassword",
    required: true,
    question: "בחרו סיסמה",
    hint: "לפחות 8 תווים",
    type: "password",
    ltr: true,
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegistrationForm({ categories, towns, loggedInEmail }: RegistrationFormProps) {
  const router = useRouter();
  const steps = loggedInEmail ? STEPS : [...STEPS, ...ACCOUNT_STEPS];
  const REVIEW_STEP_INDEX = steps.length; // step after the last input step
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [townFilter, setTownFilter] = useState("");
  const [images, setImages] = useState<PickedImages>({});

  const form = useForm<BusinessRegistrationInput>({
    resolver: zodResolver(businessRegistrationSchema),
    mode: "onChange",
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
      accountEmail: "",
      accountPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    setError,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const isReview = step >= REVIEW_STEP_INDEX;
  const current = isReview ? null : steps[step];
  const totalSteps = steps.length + 1; // +1 for review
  const progress = ((step + 1) / totalSteps) * 100;

  // Auto-focus the input when step changes
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  async function next() {
    if (!current) return;
    if (current.key === "images") {
      setStep(step + 1);
      return;
    }
    // Validate the current field; required fields block, optional ones
    // only block if the user typed something invalid (e.g. malformed email).
    const ok = await trigger(current.key);
    if (!ok) return;
    if (current.required) {
      const value = getValues(current.key);
      if (typeof value === "string" && value.trim().length === 0) return;
    }
    if (current.key === "accountEmail" && !EMAIL_RE.test(getValues("accountEmail")?.trim() ?? "")) {
      setError("accountEmail", { message: "כתובת אימייל לא תקינה" });
      return;
    }
    if (current.key === "accountPassword" && (getValues("accountPassword") ?? "").length < 8) {
      setError("accountPassword", { message: "הסיסמה צריכה להכיל לפחות 8 תווים" });
      return;
    }
    setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function skip() {
    if (!current || current.required) return;
    if (current.key === "images") {
      setStep(step + 1);
      return;
    }
    // Clear any partial value so it doesn't get submitted
    setValue(current.key, "" as never, { shouldValidate: false });
    setStep(step + 1);
  }

  function goTo(targetStep: number) {
    setStep(targetStep);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    // Never auto-submit via Enter on the review step — the user must
    // explicitly click "שלחו את הבקשה" so they can read everything first.
    if (isReview) {
      e.preventDefault();
      return;
    }
    if (current?.type !== "textarea") {
      e.preventDefault();
      next();
    }
  }

  async function onSubmit(data: BusinessRegistrationInput) {
    // Defensive guard: refuse to submit unless we are actually on the
    // review step. Prevents accidental early submits if the click on
    // the last "הבא" button somehow re-targets to the (now-rendered)
    // submit button.
    if (!isReview) {
      return;
    }
    setSubmitError(null);

    // Honeypot
    if (data.website_url_confirm) {
      setSubmitError("שגיאה בשליחה. אנא נסו שוב.");
      return;
    }

    try {
      const res = await fetch("/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        setSubmitError(result.error ?? "שגיאה בשליחת הטופס. אנא נסו שוב.");
        return;
      }
      // The business exists now and belongs to this user (the API logged a
      // new account in), so the photos go through the regular images API.
      // A failed upload doesn't block: they can add photos from /account.
      let photosFailed = false;
      if (result.id) {
        for (const kind of ["cover", "logo"] as const) {
          const img = images[kind];
          if (!img) continue;
          const body = new FormData();
          body.append("kind", kind);
          body.append("file", img.blob, `${kind}.webp`);
          const up = await fetch(`/api/businesses/${result.id}/images/`, { method: "POST", body }).catch(
            () => null,
          );
          if (!up?.ok) photosFailed = true;
        }
      }
      router.push(photosFailed ? "/thank-you/?photos=failed" : "/thank-you/");
      router.refresh();
    } catch (err) {
      console.error("Failed to submit business:", err);
      setSubmitError(
        "שגיאה בשליחת הטופס. אנא נסו שוב, ואם הבעיה ממשיכה - שלחו לנו אימייל.",
      );
    }
  }

  // Live values for the review screen
  const values = watch();

  // Filtered towns for the town picker
  const filteredTowns = townFilter.trim()
    ? towns.filter((t) => t.name.includes(townFilter.trim()))
    : towns;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={handleKeyDown}
      className="relative rounded-2xl border bg-white p-6 sm:p-10 shadow-sm overflow-hidden"
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>
            שלב {step + 1} מתוך {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div
        key={step}
        className="min-h-[260px] animate-in fade-in slide-in-from-right-2 duration-300"
      >
        {isReview ? (
          <ReviewStep
            steps={steps}
            values={values}
            images={images}
            categories={categories}
            towns={towns}
            onEdit={goTo}
          />
        ) : current ? (
          <StepRenderer
            step={current}
            categories={categories}
            towns={filteredTowns}
            townFilter={townFilter}
            setTownFilter={setTownFilter}
            register={register}
            control={control}
            setValue={setValue}
            errors={errors}
            inputRef={inputRef}
            images={images}
            setImages={setImages}
          />
        ) : null}
      </div>

      {/* Honeypot - visually hidden */}
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
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ArrowRight className="h-4 w-4" />
          חזור
        </button>

        <div className="flex items-center gap-2">
          {!isReview && current && !current.required && (
            <button
              type="button"
              onClick={skip}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              דלג
            </button>
          )}

          {isReview ? (
            <button
              key="submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
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
          ) : (
            <button
              key="next-btn"
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              הבא
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// =====================================================================
// Step renderer
// =====================================================================

interface StepRendererProps {
  step: StepDef;
  categories: Category[];
  towns: Town[];
  townFilter: string;
  setTownFilter: (v: string) => void;
  register: ReturnType<typeof useForm<BusinessRegistrationInput>>["register"];
  control: ReturnType<typeof useForm<BusinessRegistrationInput>>["control"];
  setValue: ReturnType<typeof useForm<BusinessRegistrationInput>>["setValue"];
  errors: ReturnType<
    typeof useForm<BusinessRegistrationInput>
  >["formState"]["errors"];
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  images: PickedImages;
  setImages: React.Dispatch<React.SetStateAction<PickedImages>>;
}

function StepRenderer({
  step,
  categories,
  towns,
  townFilter,
  setTownFilter,
  register,
  control,
  setValue,
  errors,
  inputRef,
  images,
  setImages,
}: StepRendererProps) {
  const error =
    step.key === "images" ? undefined : (errors[step.key]?.message as string | undefined);
  const inputBase =
    "w-full h-14 px-4 rounded-xl border bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
  const inputClass = `${inputBase} ${error ? "border-destructive" : "border-input"}`;

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
        {step.question}
        {step.required && <span className="text-destructive mr-1">*</span>}
      </h2>
      {step.hint && (
        <p className="text-sm text-muted-foreground mb-5">{step.hint}</p>
      )}

      {step.type === "images" && <ImagesPicker images={images} setImages={setImages} />}

      {/* Field */}
      {(step.type === "text" ||
      step.type === "tel" ||
      step.type === "email" ||
      step.type === "url" ||
      step.type === "password") &&
      step.key !== "images" ? (
        <input
          {...register(step.key)}
          ref={(el) => {
            register(step.key as FieldKey).ref(el);
            inputRef.current = el;
          }}
          // Use type="text" for url fields too — type="url" makes the
          // browser reject domain-only inputs like "gogo.com" before our
          // own (lenient) validator gets a chance.
          type={step.type === "text" || step.type === "url" ? "text" : step.type}
          inputMode={step.inputMode}
          autoComplete={
            step.type === "password"
              ? "new-password"
              : step.key === "accountEmail"
                ? "email"
                : undefined
          }
          dir={step.ltr ? "ltr" : undefined}
          placeholder={step.placeholder}
          className={inputClass}
        />
      ) : null}

      {step.type === "textarea" && step.key !== "images" && (
        <textarea
          {...register(step.key)}
          ref={(el) => {
            register(step.key as FieldKey).ref(el);
            inputRef.current = el;
          }}
          rows={6}
          placeholder={step.placeholder}
          className={`${inputClass} h-auto py-3 resize-none`}
        />
      )}

      {step.type === "category" && (
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const selected = field.value === cat.name;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      field.onChange(cat.name);
                    }}
                    className={`text-right px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-input bg-white text-foreground hover:border-primary/50 hover:bg-primary-soft/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        />
      )}

      {step.type === "town" && (
        <Controller
          control={control}
          name="town"
          render={({ field }) => (
            <div>
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={(el) => {
                    inputRef.current = el;
                  }}
                  type="text"
                  value={townFilter}
                  onChange={(e) => setTownFilter(e.target.value)}
                  placeholder="חפשו יישוב..."
                  className={`${inputBase} border-input pr-10`}
                />
              </div>
              <div className="max-h-[260px] overflow-y-auto rounded-xl border border-input bg-white">
                {towns.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    לא נמצאו יישובים תואמים
                  </p>
                ) : (
                  <ul className="divide-y">
                    {towns.map((t) => {
                      const selected = field.value === t.name;
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(t.name);
                              setValue("town", t.name, {
                                shouldValidate: true,
                              });
                            }}
                            className={`w-full text-right px-4 py-2.5 text-sm transition ${
                              selected
                                ? "bg-primary-soft text-primary font-bold"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            {t.name}
                            {selected && <Check className="inline h-4 w-4 mr-2" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        />
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================================================
// Review step
// =====================================================================

function ReviewStep({
  steps,
  values,
  images,
  onEdit,
}: {
  steps: StepDef[];
  values: BusinessRegistrationInput;
  images: PickedImages;
  categories: Category[];
  towns: Town[];
  onEdit: (step: number) => void;
}) {
  const items = steps.map((s, idx) => {
    if (s.key === "images") {
      const parts = [images.cover && "תמונה ראשית", images.logo && "לוגו"].filter(Boolean);
      return { ...s, value: parts.join(" + "), idx };
    }
    const raw = (values[s.key] as string | undefined)?.toString().trim() || "";
    const v = s.type === "password" && raw ? "•".repeat(raw.length) : raw;
    return { ...s, value: v, idx };
  });

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        כמעט סיימנו! בדקו את הפרטים
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        לחצו על אייקון העיפרון ליד כל שדה כדי לערוך, או על „חזור” כדי לעבור
        אחורה. כשתסיימו - לחצו על <strong>„שלחו את הבקשה”</strong> למטה.
        <br />
        <span className="text-xs">עד שתלחצו על הכפתור — הטופס לא נשלח.</span>
      </p>

      <ul className="divide-y rounded-xl border bg-muted/30">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-start gap-3 px-4 py-3 text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground">
                {item.question}
                {item.required && (
                  <span className="text-destructive mr-1">*</span>
                )}
              </div>
              {item.key === "images" && (images.cover || images.logo) && (
                <div className="mt-1.5 flex gap-2">
                  {images.cover && (
                    <img src={images.cover.preview} alt="" className="h-14 w-[88px] rounded-lg object-cover" />
                  )}
                  {images.logo && (
                    <img src={images.logo.preview} alt="" className="h-14 w-14 rounded-lg border bg-white object-contain p-1" />
                  )}
                </div>
              )}
              <div
                className={`mt-0.5 break-words ${
                  item.value
                    ? "text-foreground"
                    : "text-muted-foreground italic"
                }`}
              >
                {item.value || "(לא מולא)"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(item.idx)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-white transition"
              aria-label={`ערוך ${item.question}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =====================================================================
// Photo step
// =====================================================================

const PICK_SLOTS = [
  { kind: "cover", title: "תמונה ראשית", hint: "המקום, המוצרים או אתם בעבודה", maxW: 1600, maxH: 1200 },
  { kind: "logo", title: "לוגו", hint: "מומלץ ריבועי, על רקע לבן או שקוף", maxW: 512, maxH: 512 },
] as const;

/**
 * Picks the main photo and logo. Images are shrunk to WebP right away (for
 * the preview and a fast upload) and uploaded only after the business is
 * created on submit.
 */
function ImagesPicker({
  images,
  setImages,
}: {
  images: PickedImages;
  setImages: React.Dispatch<React.SetStateAction<PickedImages>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {PICK_SLOTS.map((slot) => (
        <PickSlot
          key={slot.kind}
          slot={slot}
          picked={images[slot.kind]}
          onChange={(img) =>
            setImages((prev) => {
              const old = prev[slot.kind];
              if (old) URL.revokeObjectURL(old.preview);
              return { ...prev, [slot.kind]: img };
            })
          }
        />
      ))}
    </div>
  );
}

function PickSlot({
  slot,
  picked,
  onChange,
}: {
  slot: (typeof PICK_SLOTS)[number];
  picked?: PickedImage;
  onChange: (img: PickedImage | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCover = slot.kind === "cover";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("אפשר להעלות רק קובצי תמונה");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await shrinkImage(file, slot.maxW, slot.maxH);
      onChange({ blob, preview: URL.createObjectURL(blob) });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "לא הצלחנו לקרוא את התמונה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#eae3d5] bg-white p-4">
      <div>
        <h3 className="font-extrabold">{slot.title}</h3>
        <p className="text-sm text-muted-foreground">{slot.hint}</p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={picked ? `החלפת ${slot.title}` : `בחירת ${slot.title}`}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed border-input bg-[#faf8f3] transition hover:border-primary ${
          isCover ? "aspect-[16/10]" : "aspect-square max-w-[200px] w-full mx-auto"
        }`}
      >
        {picked ? (
          <img
            src={picked.preview}
            alt=""
            className={`absolute inset-0 h-full w-full ${isCover ? "object-cover" : "object-contain p-3"}`}
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-semibold">לחצו לבחירת תמונה</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {picked && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="inline-flex items-center justify-center gap-1.5 min-h-10 rounded-xl border border-input px-3 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition"
        >
          <Trash2 className="h-4 w-4" />
          הסרה
        </button>
      )}
    </div>
  );
}
