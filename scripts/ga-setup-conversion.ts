/**
 * Configure a GA4 key event (conversion) for successful business registrations.
 *
 * Strategy: every visit to /thank-you/ means the registration form was
 * submitted successfully (it's the post-submit redirect target and has no
 * other inbound links). We:
 *   1. Create an Event Create Rule on the web data stream that derives a
 *      synthetic "business_registered" event from any page_view whose
 *      page_location contains "/thank-you".
 *   2. Mark "business_registered" as a Key Event (the GA4 replacement for
 *      "conversion goals").
 *
 * Both calls are idempotent — if the rule or key event already exists,
 * we skip and report.
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/ga-setup-conversion.ts
 */

import { GoogleAuth } from "google-auth-library";

const TARGET_PROPERTY_NAME = "צפון ביז";
const EVENT_NAME = "business_registered";
const ADMIN_V1BETA = "https://analyticsadmin.googleapis.com/v1beta";
const ADMIN_V1ALPHA = "https://analyticsadmin.googleapis.com/v1alpha";

async function main() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/analytics.edit"],
  });
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  const token = tokenResp.token;
  if (!token) throw new Error("Failed to get access token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ── 1. Find the property ─────────────────────────────────────────────
  const accountsRes = await fetch(`${ADMIN_V1BETA}/accounts`, { headers });
  const accountsJson = (await accountsRes.json()) as {
    accounts?: { name: string; displayName: string }[];
  };
  let property: { name: string; displayName: string } | undefined;
  for (const acc of accountsJson.accounts ?? []) {
    const propsRes = await fetch(
      `${ADMIN_V1BETA}/properties?filter=parent:${acc.name}`,
      { headers },
    );
    const propsJson = (await propsRes.json()) as {
      properties?: { name: string; displayName: string }[];
    };
    const found = (propsJson.properties ?? []).find(
      (p) => p.displayName === TARGET_PROPERTY_NAME,
    );
    if (found) {
      property = found;
      break;
    }
  }
  if (!property) throw new Error(`Property "${TARGET_PROPERTY_NAME}" not found`);
  console.log(`Property: ${property.displayName} (${property.name})\n`);

  // ── 2. Find the web data stream ──────────────────────────────────────
  const streamsRes = await fetch(
    `${ADMIN_V1BETA}/${property.name}/dataStreams`,
    { headers },
  );
  const streamsJson = (await streamsRes.json()) as {
    dataStreams?: {
      name: string;
      displayName: string;
      type: string;
      webStreamData?: { defaultUri: string; measurementId: string };
    }[];
  };
  const webStream = (streamsJson.dataStreams ?? []).find(
    (s) => s.type === "WEB_DATA_STREAM",
  );
  if (!webStream) throw new Error("No web data stream found");
  console.log(
    `Web stream: ${webStream.displayName} (${webStream.webStreamData?.measurementId})\n`,
  );

  // ── 3. Check if the Event Create Rule already exists ─────────────────
  console.log("→ Checking existing Event Create Rules...");
  const rulesListRes = await fetch(
    `${ADMIN_V1ALPHA}/${webStream.name}/eventCreateRules`,
    { headers },
  );
  const rulesListJson = (await rulesListRes.json()) as {
    eventCreateRules?: { name: string; destinationEvent: string }[];
  };
  const existingRule = (rulesListJson.eventCreateRules ?? []).find(
    (r) => r.destinationEvent === EVENT_NAME,
  );

  if (existingRule) {
    console.log(`  ✓ Rule already exists: ${existingRule.name}\n`);
  } else {
    console.log(`→ Creating Event Create Rule "${EVENT_NAME}"...`);
    const createRuleBody = {
      destinationEvent: EVENT_NAME,
      eventConditions: [
        {
          field: "event_name",
          comparisonType: "EQUALS",
          value: "page_view",
        },
        {
          field: "page_location",
          comparisonType: "CONTAINS",
          value: "/thank-you",
        },
      ],
      sourceCopyParameters: true,
    };
    const createRuleRes = await fetch(
      `${ADMIN_V1ALPHA}/${webStream.name}/eventCreateRules`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(createRuleBody),
      },
    );
    if (!createRuleRes.ok) {
      const text = await createRuleRes.text();
      throw new Error(
        `eventCreateRules.create failed: ${createRuleRes.status} ${text}`,
      );
    }
    const createdRule = (await createRuleRes.json()) as { name: string };
    console.log(`  ✓ Created: ${createdRule.name}\n`);
  }

  // ── 4. Check if the Key Event already exists ─────────────────────────
  console.log("→ Checking existing Key Events...");
  const keyEventsListRes = await fetch(
    `${ADMIN_V1BETA}/${property.name}/keyEvents`,
    { headers },
  );
  const keyEventsListJson = (await keyEventsListRes.json()) as {
    keyEvents?: { name: string; eventName: string }[];
  };
  const existingKeyEvent = (keyEventsListJson.keyEvents ?? []).find(
    (k) => k.eventName === EVENT_NAME,
  );

  if (existingKeyEvent) {
    console.log(`  ✓ Key event already exists: ${existingKeyEvent.name}\n`);
  } else {
    console.log(`→ Marking "${EVENT_NAME}" as a Key Event...`);
    const createKeyEventBody = {
      eventName: EVENT_NAME,
      countingMethod: "ONCE_PER_EVENT",
    };
    const createKeyEventRes = await fetch(
      `${ADMIN_V1BETA}/${property.name}/keyEvents`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(createKeyEventBody),
      },
    );
    if (!createKeyEventRes.ok) {
      const text = await createKeyEventRes.text();
      throw new Error(
        `keyEvents.create failed: ${createKeyEventRes.status} ${text}`,
      );
    }
    const createdKeyEvent = (await createKeyEventRes.json()) as { name: string };
    console.log(`  ✓ Created: ${createdKeyEvent.name}\n`);
  }

  console.log("✅ DONE");
  console.log(`\nFrom now on, every visit to a URL containing "/thank-you/"`);
  console.log(`will fire a "${EVENT_NAME}" event, counted as a key event`);
  console.log(`(conversion) in Google Analytics.\n`);
  console.log(`Note: GA may take a few hours to start showing the event in`);
  console.log(`reports, but the rule applies immediately to new traffic.`);
}

main().catch((err) => {
  console.error("\n❌ ga-setup-conversion failed:", err.message ?? err);
  process.exit(1);
});
