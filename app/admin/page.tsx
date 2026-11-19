import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessesByStatus, getUsersOverview } from "@/lib/db";
import { emailEnabled } from "@/lib/notify";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

/** Admin panel — only the single 'admin' user (Shahar) gets in. */
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/admin/");
  if (user.role !== "admin") redirect("/account/");

  const [pending, approved, rejected, users] = await Promise.all([
    getBusinessesByStatus("pending"),
    getBusinessesByStatus("approved"),
    getBusinessesByStatus("rejected"),
    getUsersOverview(),
  ]);

  return (
    <AdminPanel
      adminEmail={user.email}
      pending={pending}
      approved={approved}
      rejected={rejected}
      users={users}
      emailEnabled={emailEnabled()}
    />
  );
}
