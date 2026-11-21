"use client";

/* eslint-disable @next/next/no-img-element -- previews of user uploads / blob URLs */

/**
 * Upload / replace / remove the business's main photo and logo.
 *
 * The browser shrinks every image before upload (canvas → WebP): the main
 * photo to at most 1600px wide, the logo to at most 512px. Phone photos of
 * 5–10 MB become ~200 KB, uploads are fast, and R2 stays small.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

type Slot = {
  kind: "cover" | "logo";
  title: string;
  hint: string;
  maxW: number;
  maxH: number;
};

const SLOTS: Slot[] = [
  {
    kind: "cover",
    title: "תמונה ראשית",
    hint: "המקום, המוצרים או אתם בעבודה. תמונה רחבה ומוארת נראית הכי טוב.",
    maxW: 1600,
    maxH: 1200,
  },
  {
    kind: "logo",
    title: "לוגו",
    hint: "הלוגו של העסק. מומלץ ריבועי, על רקע לבן או שקוף.",
    maxW: 512,
    maxH: 512,
  },
];

/** Resizes an image file in the browser and re-encodes it as WebP. */
export async function shrinkImage(file: File, maxW: number, maxH: number): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("הדפדפן לא הצליח לקרוא את התמונה. נסו קובץ JPG או PNG.");
  }
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("encode failed");
  return blob;
}

export function BusinessImagesEditor({
  businessId,
  coverUrl,
  logoUrl,
}: {
  businessId: string;
  coverUrl?: string;
  logoUrl?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {SLOTS.map((slot) => (
        <ImageSlot
          key={slot.kind}
          slot={slot}
          businessId={businessId}
          initialUrl={slot.kind === "cover" ? coverUrl : logoUrl}
        />
      ))}
    </div>
  );
}

function ImageSlot({
  slot,
  businessId,
  initialUrl,
}: {
  slot: Slot;
  businessId: string;
  initialUrl?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = `/api/businesses/${businessId}/images/`;

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
      const form = new FormData();
      form.append("kind", slot.kind);
      form.append("file", blob, `${slot.kind}.webp`);
      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "ההעלאה נכשלה");
      setUrl(data.url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "ההעלאה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!confirm(`להסיר את ה${slot.title}?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`${endpoint}?kind=${slot.kind}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("ההסרה נכשלה");
      return;
    }
    setUrl(undefined);
    router.refresh();
  }

  const isCover = slot.kind === "cover";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#eae3d5] bg-white p-4">
      <div>
        <h3 className="font-extrabold">{slot.title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{slot.hint}</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={url ? `החלפת ${slot.title}` : `העלאת ${slot.title}`}
        className={`group relative overflow-hidden rounded-xl border-2 border-dashed border-input bg-[#faf8f3] transition hover:border-primary ${
          isCover ? "aspect-[16/10]" : "aspect-square max-w-[220px] w-full mx-auto"
        }`}
      >
        {url ? (
          <img
            src={url}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
        >
          {url ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {url ? "החלפה" : "העלאה"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl border border-input px-4 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive disabled:opacity-60 transition"
          >
            <Trash2 className="h-4 w-4" />
            הסרה
          </button>
        )}
      </div>
    </div>
  );
}
