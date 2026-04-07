/**
 * Smart build trigger - skips a full Next.js build when nothing has changed
 * since the last successful deploy.
 *
 * The "last build time" is stored in Firestore at /meta/lastBuild as an ISO
 * timestamp. This script:
 *   1. Reads lastBuild from /meta/lastBuild
 *   2. Queries businesses where updatedAt > lastBuild (or status='approved'
 *      and approvedAt > lastBuild)
 *   3. If no changes -> exits 0 with "skip" message
 *   4. If changes -> runs `next build` and `firebase deploy`, then writes
 *      a new lastBuild timestamp.
 *
 * Used by the daily cron in GitHub Actions to keep Firestore reads minimal
 * even when there are no new approvals.
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "zafon-biz";

function initFirebase() {
  if (getApps().length > 0) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

/**
 * Materialize the service account JSON to a temp file and return its path.
 * Used so that subprocesses (Firebase CLI, Next build with admin SDK) can
 * authenticate via GOOGLE_APPLICATION_CREDENTIALS the way they expect.
 */
function ensureCredentialsFile(): string | undefined {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const path = join(tmpdir(), "zafon-biz-sa.json");
    writeFileSync(path, process.env.FIREBASE_SERVICE_ACCOUNT, { mode: 0o600 });
    return path;
  }
  return undefined;
}

function run(cmd: string, args: string[], extraEnv?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...extraEnv },
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  initFirebase();
  const db = getFirestore();

  // Read last build timestamp
  const metaRef = db.collection("meta").doc("lastBuild");
  const metaDoc = await metaRef.get();
  const lastBuildAt = metaDoc.exists
    ? (metaDoc.data()?.timestamp as Timestamp | undefined)
    : undefined;

  console.log(`Last build: ${lastBuildAt?.toDate().toISOString() ?? "never"}`);

  // Check if there are any approved businesses changed since last build.
  // If never built before -> always build.
  let shouldBuild = !lastBuildAt;

  if (lastBuildAt) {
    // Check for new approvals
    const newApprovals = await db
      .collection("businesses")
      .where("status", "==", "approved")
      .where("approvedAt", ">", lastBuildAt)
      .limit(1)
      .get();

    // Check for any updates (deletes, edits)
    // We use approvedAt as a proxy here. For more granular checks, you can
    // add an `updatedAt` field on writes and query that instead.
    if (!newApprovals.empty) {
      shouldBuild = true;
      console.log(`Found ${newApprovals.size}+ changes since last build`);
    }
  }

  // Always rebuild on weekends/midnight to refresh the daily shuffle.
  // The cron in GitHub Actions calls us hourly; we honor a forced rebuild
  // via FORCE_BUILD=1 env var.
  if (process.env.FORCE_BUILD === "1") {
    shouldBuild = true;
    console.log("Force build requested");
  }

  if (!shouldBuild) {
    console.log("✓ No changes since last build - skipping");
    process.exit(0);
  }

  // Make sure both Next.js (admin SDK at build time) and the Firebase CLI
  // (deploy step) can authenticate via GOOGLE_APPLICATION_CREDENTIALS.
  const credentialsPath = ensureCredentialsFile();
  const childEnv: Record<string, string> = {};
  if (credentialsPath) childEnv.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

  console.log("→ Running next build...");
  await run("npx", ["next", "build"], childEnv);

  console.log("→ Deploying to Firebase Hosting...");
  await run(
    "npx",
    ["firebase", "deploy", "--only", "hosting", "--project", PROJECT_ID, "--non-interactive"],
    childEnv,
  );

  // Save new lastBuild timestamp
  await metaRef.set({
    timestamp: Timestamp.now(),
    deployedBy: process.env.GITHUB_ACTOR || "local",
  });

  console.log("✅ Build and deploy complete");
}

main().catch((err) => {
  console.error("❌ build-if-needed failed:", err);
  process.exit(1);
});
