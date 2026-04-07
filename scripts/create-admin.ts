/**
 * One-time script to create the admin user.
 *
 * - Creates a Firebase Auth user with the given email and a temporary password
 * - Adds an entry in /admins/{uid} so Firestore rules recognize the user as admin
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <temp-password>
 *
 * After running, the admin should sign in at /admin and (optionally) reset
 * their password via the Firebase Console.
 *
 * Requires: Email/Password sign-in method must be enabled in Firebase Auth.
 * If not enabled yet, run scripts/enable-email-password.ts first.
 */

import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "zafon-biz";

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <temp-password>");
    process.exit(1);
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log(`\n👤 Creating admin user: ${email}`);

  // Try to find existing user first
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  ↳ User already exists (uid: ${uid}). Updating password...`);
    await auth.updateUser(uid, { password });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") {
      const created = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: "Admin",
      });
      uid = created.uid;
      console.log(`  ↳ Created new user (uid: ${uid})`);
    } else {
      throw err;
    }
  }

  // Add to /admins/{uid}
  await db.collection("admins").doc(uid).set({
    email,
    uid,
    role: "super",
    addedAt: Timestamp.now(),
  });
  console.log(`  ↳ Added to /admins/${uid}`);

  console.log("\n✅ Admin ready!");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Login at: https://zafon-biz.web.app/admin/`);
  console.log("\n⚠️  Change the password from the Firebase Console after first login.");
}

main().catch((err) => {
  console.error("\n❌ create-admin failed:", err);
  process.exit(1);
});
