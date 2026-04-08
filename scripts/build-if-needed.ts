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

  // Read last build timestamp + last known approved count
  const metaRef = db.collection("meta").doc("lastBuild");
  const metaDoc = await metaRef.get();
  const lastBuildAt = metaDoc.exists
    ? (metaDoc.data()?.timestamp as Timestamp | undefined)
    : undefined;
  const lastApprovedCount = metaDoc.exists
    ? ((metaDoc.data()?.approvedCount as number | undefined) ?? null)
    : null;

  console.log(`Last build: ${lastBuildAt?.toDate().toISOString() ?? "never"}`);
  console.log(`Last approved count: ${lastApprovedCount ?? "unknown"}`);

  // Always query the current count of approved businesses. This is what
  // catches deletions, unapprovals, and even bulk wipes — situations
  // where no "new approval" exists but the live site is still stale.
  const approvedSnap = await db
    .collection("businesses")
    .where("status", "==", "approved")
    .count()
    .get();
  const currentApprovedCount = approvedSnap.data().count;
  console.log(`Current approved count: ${currentApprovedCount}`);

  // If never built before -> always build.
  let shouldBuild = !lastBuildAt;
  let buildReason = shouldBuild ? "first build" : "";

  // Approved-count delta catches deletes, unapprovals, AND new approvals.
  if (lastBuildAt && lastApprovedCount !== currentApprovedCount) {
    shouldBuild = true;
    buildReason = `approved count changed: ${lastApprovedCount} → ${currentApprovedCount}`;
  }

  // Defensive secondary check: a same-count edit (e.g. an admin edits a
  // business in place without changing approval state) won't move the
  // count, but the existing approvedAt watermark query still picks up
  // any re-approval. Kept for that edge case.
  if (lastBuildAt && !shouldBuild) {
    const newApprovals = await db
      .collection("businesses")
      .where("status", "==", "approved")
      .where("approvedAt", ">", lastBuildAt)
      .orderBy("approvedAt", "desc")
      .limit(1)
      .get();
    if (!newApprovals.empty) {
      shouldBuild = true;
      buildReason = "new approval since last build";
    }
  }

  if (shouldBuild && buildReason) {
    console.log(`→ ${buildReason}`);
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

  // Save new lastBuild timestamp + the approved count we just deployed,
  // so the next run can detect deletes/unapprovals via count delta.
  await metaRef.set({
    timestamp: Timestamp.now(),
    approvedCount: currentApprovedCount,
    deployedBy: process.env.GITHUB_ACTOR || "local",
  });

  console.log("✅ Build and deploy complete");
}

main().catch((err) => {
  console.error("❌ build-if-needed failed:", err);
  process.exit(1);
});
