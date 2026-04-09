/**
 * One-time setup script for Google Analytics 4.
 *
 * Authenticates as the zafon-biz service account (which must already be
 * added as an Editor on the target GA Account in the Analytics UI), then:
 *   1. Lists GA Accounts the service account can see
 *   2. Finds the one named "שחר גולן"
 *   3. Creates a new Property "צפון ביז" inside it (Asia/Jerusalem, ILS)
 *   4. Creates a Web Data Stream for https://zafon-biz.web.app
 *   5. Prints the Measurement ID (G-XXXXXXX) to wire into the site
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/setup-analytics.ts
 */

import { GoogleAuth } from "google-auth-library";

const TARGET_ACCOUNT_NAME = "שחר גולן";
const NEW_PROPERTY_NAME = "צפון ביז";
const SITE_URL = "https://zafon-biz.web.app";
const STREAM_NAME = "zafon-biz web";
const TIME_ZONE = "Asia/Jerusalem";
const CURRENCY = "ILS";

const API = "https://analyticsadmin.googleapis.com/v1beta";

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

  // 1. List accounts visible to the service account
  console.log("→ Listing GA accounts...");
  const accountsRes = await fetch(`${API}/accounts`, { headers });
  if (!accountsRes.ok) {
    const text = await accountsRes.text();
    throw new Error(`accounts.list failed: ${accountsRes.status} ${text}`);
  }
  const accountsJson = (await accountsRes.json()) as {
    accounts?: Array<{ name: string; displayName: string }>;
  };
  const accounts = accountsJson.accounts ?? [];
  if (accounts.length === 0) {
    throw new Error(
      "No GA accounts visible to the service account. Did you add zafon-biz-admin@zafon-biz.iam.gserviceaccount.com as an Editor on the GA account?",
    );
  }
  console.log(
    `  found ${accounts.length} account(s): ${accounts.map((a) => `"${a.displayName}"`).join(", ")}`,
  );

  const targetAccount = accounts.find((a) => a.displayName === TARGET_ACCOUNT_NAME);
  if (!targetAccount) {
    throw new Error(
      `Account "${TARGET_ACCOUNT_NAME}" not found. Available: ${accounts.map((a) => a.displayName).join(", ")}`,
    );
  }
  console.log(`  ✓ target account: ${targetAccount.name} (${targetAccount.displayName})`);

  // 2. Check existing properties to avoid duplicates
  console.log(`→ Listing existing properties under ${targetAccount.name}...`);
  const propsRes = await fetch(
    `${API}/properties?filter=parent:${targetAccount.name}`,
    { headers },
  );
  if (!propsRes.ok) {
    const text = await propsRes.text();
    throw new Error(`properties.list failed: ${propsRes.status} ${text}`);
  }
  const propsJson = (await propsRes.json()) as {
    properties?: Array<{ name: string; displayName: string }>;
  };
  const existingProps = propsJson.properties ?? [];
  console.log(
    `  found ${existingProps.length} existing prop(s): ${existingProps.map((p) => `"${p.displayName}"`).join(", ") || "(none)"}`,
  );

  const dup = existingProps.find((p) => p.displayName === NEW_PROPERTY_NAME);
  if (dup) {
    throw new Error(
      `Property "${NEW_PROPERTY_NAME}" already exists (${dup.name}). Aborting to avoid duplicate.`,
    );
  }

  // 3. Create the new property
  console.log(`→ Creating property "${NEW_PROPERTY_NAME}"...`);
  const createPropBody = {
    parent: targetAccount.name,
    displayName: NEW_PROPERTY_NAME,
    timeZone: TIME_ZONE,
    currencyCode: CURRENCY,
    industryCategory: "BUSINESS_AND_INDUSTRIAL_MARKETS",
  };
  const createPropRes = await fetch(`${API}/properties`, {
    method: "POST",
    headers,
    body: JSON.stringify(createPropBody),
  });
  if (!createPropRes.ok) {
    const text = await createPropRes.text();
    throw new Error(`properties.create failed: ${createPropRes.status} ${text}`);
  }
  const property = (await createPropRes.json()) as {
    name: string;
    displayName: string;
  };
  console.log(`  ✓ created: ${property.name} (${property.displayName})`);

  // 4. Create a web data stream
  console.log(`→ Creating web data stream for ${SITE_URL}...`);
  const createStreamBody = {
    type: "WEB_DATA_STREAM",
    displayName: STREAM_NAME,
    webStreamData: {
      defaultUri: SITE_URL,
    },
  };
  const createStreamRes = await fetch(
    `${API}/${property.name}/dataStreams`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(createStreamBody),
    },
  );
  if (!createStreamRes.ok) {
    const text = await createStreamRes.text();
    throw new Error(
      `dataStreams.create failed: ${createStreamRes.status} ${text}`,
    );
  }
  const stream = (await createStreamRes.json()) as {
    name: string;
    webStreamData?: { measurementId?: string };
  };
  const measurementId = stream.webStreamData?.measurementId;
  if (!measurementId) {
    throw new Error(`No measurementId returned: ${JSON.stringify(stream)}`);
  }

  console.log(`\n✓ DONE\n`);
  console.log(`  Property:        ${property.name}`);
  console.log(`  Display name:    ${property.displayName}`);
  console.log(`  Data stream:     ${stream.name}`);
  console.log(`  Site URL:        ${SITE_URL}`);
  console.log(`  Measurement ID:  ${measurementId}`);
  console.log(`\n  → Add to .env.local:`);
  console.log(`     NEXT_PUBLIC_GA_MEASUREMENT_ID=${measurementId}\n`);
}

main().catch((err) => {
  console.error("\n❌ setup failed:", err.message ?? err);
  process.exit(1);
});
