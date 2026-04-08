"use client";

/**
 * Multi-step business registration wizard.
 *
 * One question per step. Required steps block "next" until valid; optional
 * steps offer a "skip" button. The final step is a review screen showing
 * everything the user filled in, with edit links back to each step.
 *
 * Built on a single react-hook-form instance — `trigger(field)` is used to
 * validate just the current step's field before advancing.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Loader2,
  Send,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Pencil,
  Search,
} from "lucide-react";
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

type FieldKey = Exclude<
  keyof BusinessRegistrationInput,
  "website_url_confirm"
>;

type StepDef = {
  key: FieldKey;
  required: boolean;
  question: string;
  hint?: string;
  placeholder?: string;
  type: "text" | "textarea" | "tel" | "email" | "url" | "category" | "town";
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
    hint: "אופציונלי. כולל https://",
    placeholder: "https://example.com",
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
    hint: "אופציונלי",
    placeholder: "https://facebook.com/...",
    type: "url",
    inputMode: "url",
    ltr: true,
  },
  {
    key: "instagram",
    required: false,
    question: "יש לעסק חשבון אינסטגרם?",
    hint: "אופציונלי",
    placeholder: "https://instagram.com/...",
    type: "url",
    inputMode: "url",
    ltr: true,
  },
];

const REVIEW_STEP_INDEX = STEPS.length; // step after the last input step

export function RegistrationForm({ categories, towns }: RegistrationFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [townFilter, setTownFilter] = useState("");

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
    },
  });

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const isReview = step >= REVIEW_STEP_INDEX;
  const current = isReview ? null : STEPS[step];
  const totalSteps = STEPS.length + 1; // +1 for review
  const progress = ((step + 1) / totalSteps) * 100;

  // Auto-focus the input when step changes
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  async function next() {
    if (!current) return;
    // Validate the current field; required fields block, optional ones
    // only block if the user typed something invalid (e.g. malformed email).
    const ok = await trigger(current.key);
    if (!ok) return;
    if (current.required) {
      const value = getValues(current.key);
      if (typeof value === "string" && value.trim().length === 0) return;
    }
    setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function skip() {
    if (!current || current.required) return;
    // Clear any partial value so it doesn't get submitted
    setValue(current.key, "" as never, { shouldValidate: false });
    setStep(step + 1);
  }

  function goTo(targetStep: number) {
    setStep(targetStep);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && current?.type !== "textarea") {
      e.preventDefault();
      next();
    }
  }

  async function onSubmit(data: BusinessRegistrationInput) {
    setSubmitError(null);

    // Honeypot
    if (data.website_url_confirm) {
      setSubmitError("שגיאה בשליחה. אנא נסו שוב.");
      return;
    }

    try {
      const baseSlug = slugify(data.name);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
      const shuffleSeed = Math.floor(Math.random() * 1_000_000_000);

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
            values={values}
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
}: StepRendererProps) {
  const error = errors[step.key]?.message as string | undefined;
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

      {/* Field */}
      {step.type === "text" || step.type === "tel" || step.type === "email" || step.type === "url" ? (
        <input
          {...register(step.key)}
          ref={(el) => {
            register(step.key).ref(el);
            inputRef.current = el;
          }}
          type={step.type === "text" ? "text" : step.type}
          inputMode={step.inputMode}
          dir={step.ltr ? "ltr" : undefined}
          placeholder={step.placeholder}
          className={inputClass}
        />
      ) : null}

      {step.type === "textarea" && (
        <textarea
          {...register(step.key)}
          ref={(el) => {
            register(step.key).ref(el);
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
  values,
  onEdit,
}: {
  values: BusinessRegistrationInput;
  categories: Category[];
  towns: Town[];
  onEdit: (step: number) => void;
}) {
  const items = STEPS.map((s, idx) => {
    const v = (values[s.key] as string | undefined)?.toString().trim() || "";
    return { ...s, value: v, idx };
  });

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        כמעט סיימנו! בואו נסקור את הפרטים
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        לחצו על העיפרון ליד כל פרט כדי לערוך אותו, ואז שלחו את הבקשה.
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
