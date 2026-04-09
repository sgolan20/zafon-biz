/**
 * Quick Google Analytics report from the CLI.
 *
 * Uses the same service account as setup-analytics.ts (read-only scope this
 * time) to query the Analytics Data API. Pulls:
 *   - Realtime active users (last 30 min)
 *   - Last 7 days: users, sessions, page views, top pages, top countries
 *   - Last 30 days: users, sessions
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/ga-report.ts
 */

import { GoogleAuth } from "google-auth-library";

const TARGET_PROPERTY_NAME = "צפון ביז";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };

async function main() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  const token = tokenResp.token;
  if (!token) throw new Error("Failed to get access token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. Find the property ID for "צפון ביז"
  const accountsRes = await fetch(`${ADMIN_API}/accounts`, { headers });
  const accountsJson = (await accountsRes.json()) as {
    accounts?: { name: string; displayName: string }[];
  };
  const accounts = accountsJson.accounts ?? [];

  let property: { name: string; displayName: string } | undefined;
  for (const acc of accounts) {
    const propsRes = await fetch(
      `${ADMIN_API}/properties?filter=parent:${acc.name}`,
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
  if (!property) {
    throw new Error(`Property "${TARGET_PROPERTY_NAME}" not found`);
  }
  // property.name is like "properties/123456789"
  const propertyPath = property.name;
  console.log(`Property: ${property.displayName} (${propertyPath})\n`);

  // 2. Realtime — active users in last 30 min
  console.log("════════ REALTIME (last 30 min) ════════");
  const realtimeRes = await fetch(
    `${DATA_API}/${propertyPath}:runRealtimeReport`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        metrics: [{ name: "activeUsers" }],
      }),
    },
  );
  const realtimeJson = (await realtimeRes.json()) as { rows?: Row[] };
  const activeUsers = realtimeJson.rows?.[0]?.metricValues?.[0]?.value ?? "0";
  console.log(`  Active users right now: ${activeUsers}\n`);

  // 3. Last 7 days summary
  console.log("════════ LAST 7 DAYS ════════");
  const summaryRes = await fetch(`${DATA_API}/${propertyPath}:runReport`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
    }),
  });
  const summaryJson = (await summaryRes.json()) as { rows?: Row[] };
  const m = summaryJson.rows?.[0]?.metricValues ?? [];
  console.log(`  Total users:       ${m[0]?.value ?? "0"}`);
  console.log(`  New users:         ${m[1]?.value ?? "0"}`);
  console.log(`  Sessions:          ${m[2]?.value ?? "0"}`);
  console.log(`  Page views:        ${m[3]?.value ?? "0"}`);
  const avgSec = parseFloat(m[4]?.value ?? "0");
  console.log(`  Avg session:       ${Math.round(avgSec)}s\n`);

  // 4. Top pages last 7 days
  console.log("════════ TOP PAGES (last 7 days) ════════");
  const pagesRes = await fetch(`${DATA_API}/${propertyPath}:runReport`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
  });
  const pagesJson = (await pagesRes.json()) as { rows?: Row[] };
  const pages = pagesJson.rows ?? [];
  if (pages.length === 0) {
    console.log("  (no data)");
  } else {
    for (const r of pages) {
      const path = r.dimensionValues?.[0]?.value ?? "?";
      const views = r.metricValues?.[0]?.value ?? "0";
      console.log(`  ${views.padStart(5)}  ${path}`);
    }
  }
  console.log();

  // 5. Top countries last 7 days
  console.log("════════ TOP COUNTRIES (last 7 days) ════════");
  const countriesRes = await fetch(`${DATA_API}/${propertyPath}:runReport`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
      limit: 10,
    }),
  });
  const countriesJson = (await countriesRes.json()) as { rows?: Row[] };
  const countries = countriesJson.rows ?? [];
  if (countries.length === 0) {
    console.log("  (no data)");
  } else {
    for (const r of countries) {
      const country = r.dimensionValues?.[0]?.value ?? "?";
      const users = r.metricValues?.[0]?.value ?? "0";
      console.log(`  ${users.padStart(5)}  ${country}`);
    }
  }
  console.log();

  // 6. Last 30 days topline
  console.log("════════ LAST 30 DAYS ════════");
  const monthRes = await fetch(`${DATA_API}/${propertyPath}:runReport`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }),
  });
  const monthJson = (await monthRes.json()) as { rows?: Row[] };
  const mm = monthJson.rows?.[0]?.metricValues ?? [];
  console.log(`  Total users:  ${mm[0]?.value ?? "0"}`);
  console.log(`  Sessions:     ${mm[1]?.value ?? "0"}`);
  console.log(`  Page views:   ${mm[2]?.value ?? "0"}`);
}

main().catch((err) => {
  console.error("\n❌ ga-report failed:", err.message ?? err);
  process.exit(1);
});
