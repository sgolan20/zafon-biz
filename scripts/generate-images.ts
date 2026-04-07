/**
 * Generate decorative images for the homepage via Replicate (google/nano-banana-2).
 *
 * Usage (token must be passed inline; never commit it):
 *   REPLICATE_API_TOKEN=r8_xxx npx tsx scripts/generate-images.ts
 *
 * Saves output to public/images/.
 */

import { writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "images");

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error(
    "Missing REPLICATE_API_TOKEN. Pass it inline:\n" +
      "  REPLICATE_API_TOKEN=r8_xxx npx tsx scripts/generate-images.ts",
  );
  process.exit(1);
}

type Job = {
  filename: string;
  prompt: string;
  aspect_ratio: "1:1" | "3:2" | "2:3";
};

const PHOTO_STYLE =
  "Realistic editorial photograph, natural warm window light, shallow depth of field, " +
  "candid documentary feel, soft film grain, authentic, no text, no logos, " +
  "professional photojournalism quality";

// Style for the diverse, no-face "real work" showcase round.
// Faces are intentionally cropped out — AI struggles with realistic faces and
// faceless hands+tools+materials look more authentic and more universal.
const CANDID_STYLE =
  "Hyper-realistic amateur documentary photograph, iPhone snapshot quality, " +
  "slightly off-center framing, NO FACES VISIBLE — face is intentionally " +
  "cropped out of the frame, only hands, arms, torso, tools and materials. " +
  "Real imperfections: visible wear on tools, work stains, dust, scuffed " +
  "wood, age spots on hands. Soft film grain, natural ambient light only, " +
  "no studio lighting, no glamorous styling, no text, no logos, no signage. " +
  "Avoid the polished editorial look.";

const JOBS: Job[] = [
  {
    filename: "hero-bakery.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A realistic editorial photograph of an Israeli man and woman, warm " +
      "Mediterranean appearance with dark hair, around 35 years old, wearing simple " +
      "flour-dusted aprons, working together side by side in their small family " +
      "bakery in northern Israel. They are decorating fresh homemade cakes on a " +
      "rustic wooden counter, smiling softly at their work. Behind them: wooden " +
      "shelves stacked with fresh bread loaves, wicker baskets, a glass display " +
      "of pastries. Soft warm morning light pouring through a side window, shallow " +
      "depth of field, candid documentary feel, soft film grain, authentic. " +
      PHOTO_STYLE,
  },
  {
    filename: "scene-carpenter.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A realistic editorial photograph of an Israeli carpenter, warm Mediterranean " +
      "appearance with short dark hair and a short beard, around 40 years old, " +
      "wearing a simple work shirt and a leather apron, hands working on a wooden " +
      "table he is building in his small workshop in northern Israel. Wood shavings " +
      "and sawdust on the floor, hand planes and chisels hanging on a pegboard wall, " +
      "stacks of timber in the background. Warm afternoon sunlight streaming through " +
      "a high window catching the dust in the air. Concentrated, calm expression. " +
      PHOTO_STYLE,
  },
  {
    filename: "scene-potter.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A realistic editorial photograph of an Israeli woman ceramic artist, warm " +
      "Mediterranean appearance with dark curly hair tied back, around 35 years " +
      "old, wearing a clay-stained apron, sitting at a pottery wheel in her small " +
      "ceramics studio in northern Israel. Her wet hands are gently shaping a " +
      "tall clay vase as the wheel spins. Finished glazed pottery in earthy reds " +
      "and blues displayed on wooden shelves behind her, soft warm window light " +
      "from the side. Calm, focused, creative atmosphere. " +
      PHOTO_STYLE,
  },
  {
    filename: "scene-cheese.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A documentary photograph inside a small artisanal cheese cellar in " +
      "northern Israel. In the foreground, weathered older hands — sun-spotted, " +
      "wrinkled, with rough fingernails — are using a thin wire cheese cutter to " +
      "slice a wedge from a large round wheel of pale aged cheese resting on a " +
      "worn wooden plank. Only a faded blue work shirt sleeve and a stained " +
      "canvas apron are visible — the face is cropped out above the top of the " +
      "frame. Behind the hands, dozens of round cheese wheels rest on rough " +
      "wooden shelves stacked floor to ceiling, fading into dim warm light from " +
      "a single hanging bulb. Faint dust particles suspended in the air. " +
      CANDID_STYLE,
  },
  {
    filename: "scene-winemaker.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A documentary photograph inside a small Galilean winery in northern " +
      "Israel. The frame is cropped at chest level — no face visible — showing " +
      "weathered older hands with stained fingernails uncorking an unlabeled " +
      "bottle of dark red wine over a rough wooden table. The person wears a " +
      "worn dark green flannel shirt rolled up at the sleeves and a leather " +
      "apron with grape stains. Behind the hands, large oak wine barrels stacked " +
      "on wooden racks, soft warm light filtering through a small window, dust " +
      "drifting in the air. " +
      CANDID_STYLE,
  },
  {
    filename: "scene-tailor.jpg",
    aspect_ratio: "3:2",
    prompt:
      "A documentary photograph of an old tailor's workshop in northern Israel. " +
      "Top-down overhead view of an old black Singer sewing machine on a " +
      "wooden table. Hands of an elderly person guiding a piece of dark navy " +
      "fabric under the moving needle — only the hands and forearms in worn " +
      "beige cardigan sleeves are visible, no face in frame. A yellow tape " +
      "measure draped across the table, brass scissors, white tailor's chalk, " +
      "spools of thread, scattered fabric scraps. Cool fluorescent ceiling light " +
      "mixed with a warm desk lamp glow on the work surface, well-used wooden " +
      "table with marks and ink stains. " +
      CANDID_STYLE,
  },
];

async function runPredictionOnce(job: Job): Promise<string> {
  const res = await fetch(
    "https://api.replicate.com/v1/models/openai/gpt-image-1.5/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: {
          prompt: job.prompt,
          aspect_ratio: job.aspect_ratio,
          quality: "low",
          moderation: "low",
          output_format: "jpeg",
          number_of_images: 1,
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  let prediction = (await res.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
    urls: { get: string };
  };

  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    prediction = (await pollRes.json()) as typeof prediction;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(
      `status=${prediction.status} error=${JSON.stringify(prediction.error) || "(none)"} id=${prediction.id}`,
    );
  }

  const out = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;
  if (!out) throw new Error("No output URL returned");
  return out;
}

async function runPrediction(job: Job): Promise<string> {
  console.log(`\n→ Generating ${job.filename} (${job.aspect_ratio})`);
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runPredictionOnce(job);
    } catch (e) {
      const msg = (e as Error).message;
      const transient =
        msg.includes("E003") ||
        msg.includes("high demand") ||
        msg.includes("unavailable") ||
        msg.includes("ReadTimeout") ||
        msg.includes("Timeout") ||
        msg.includes("status=failed error=\"\"") ||
        msg.includes("429") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("504");
      if (!transient || attempt === maxAttempts) throw e;
      const wait = Math.min(60_000, 5_000 * 2 ** (attempt - 1));
      console.log(
        `   attempt ${attempt} failed (${msg.slice(0, 60)}…), retrying in ${wait / 1000}s`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("unreachable");
}

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = join(OUT_DIR, filename);
  writeFileSync(path, buf);
  console.log(`   ✓ saved ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  const force = process.argv.includes("--force");
  console.log(`Generating ${JOBS.length} images → ${OUT_DIR}`);
  for (const job of JOBS) {
    const path = join(OUT_DIR, job.filename);
    if (!force && existsSync(path)) {
      console.log(`\n→ ${job.filename}: already exists, skipping`);
      continue;
    }
    try {
      const url = await runPrediction(job);
      await downloadImage(url, job.filename);
    } catch (e) {
      console.error(`   ✗ ${job.filename}:`, (e as Error).message);
    }
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
