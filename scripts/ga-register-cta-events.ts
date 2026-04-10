/**
 * Register phone_click and whatsapp_click as GA4 key events.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/ga-register-cta-events.ts
 */

import { GoogleAuth } from "google-auth-library";

const API = "https://analyticsadmin.googleapis.com/v1beta";
const PROPERTY = "properties/532256651";

async function main() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/analytics.edit"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token!;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  for (const eventName of ["phone_click", "whatsapp_click"]) {
    const res = await fetch(`${API}/${PROPERTY}/keyEvents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ eventName, countingMethod: "ONCE_PER_EVENT" }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (text.includes("ALREADY_EXISTS")) {
        console.log(`✓ "${eventName}" already exists as key event`);
      } else {
        console.error(`✗ ${eventName}: ${res.status} ${text}`);
      }
    } else {
      const data = (await res.json()) as { name: string };
      console.log(`✓ Created key event "${eventName}" (${data.name})`);
    }
  }
}

main().catch((err) => {
  console.error("❌ failed:", err.message ?? err);
  process.exit(1);
});
