/**
 * Enable Email/Password sign-in method via Identity Toolkit Admin REST API.
 *
 * The Firebase CLI doesn't have a command for this, and the Admin SDK doesn't
 * expose it directly, so we call the REST API ourselves with an OAuth access
 * token from the service account.
 *
 * Run once after creating the project:
 *   npx tsx scripts/enable-email-password.ts
 */

import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = "zafon-biz";

async function getToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new Error("Failed to obtain access token");
  return accessToken.token;
}

async function initializeAuth(token: string): Promise<void> {
  // First, try to initialize Identity Platform for this project.
  // This is a one-time bootstrap; subsequent calls return ALREADY_EXISTS.
  const url = `https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/identityPlatform:initializeAuth`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (res.ok) {
    console.log("✓ Identity Platform initialized");
    return;
  }

  const text = await res.text();
  if (text.includes("ALREADY_EXISTS") || text.includes("already")) {
    console.log("✓ Identity Platform already initialized");
    return;
  }

  console.error(`❌ initializeAuth: ${res.status} ${res.statusText}`);
  console.error(text);
  throw new Error("Failed to initialize Identity Platform");
}

async function enableEmailPassword(token: string): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email`;
  const body = {
    signIn: {
      email: {
        enabled: true,
        passwordRequired: true,
      },
    },
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ enableEmailPassword: ${res.status} ${res.statusText}`);
    console.error(text);
    throw new Error("Failed to enable email/password");
  }

  const data = await res.json();
  console.log("✓ Email/Password sign-in enabled");
  if (data?.signIn?.email) {
    console.log("  Config:", JSON.stringify(data.signIn.email));
  }
}

async function main() {
  const token = await getToken();
  await initializeAuth(token);
  await enableEmailPassword(token);
  console.log("\n✅ Auth setup complete!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
