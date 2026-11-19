import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessById, getCategories, getTowns } from "@/lib/db";
import { BusinessEditForm } from "@/components/BusinessEditForm";

export const dynamic = "force-dynamic";

export default async function AdminEditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login/?next=/admin/business/${id}/`);
  if (user.role !== "admin") redirect("/account/");

  const [business, categories, towns] = await Promise.all([
    getBusinessById(id),
    getCategories(),
    getTowns(),
  ]);
  if (!business) notFound();

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">עריכה: {business.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        סטטוס: {business.status === "approved" ? "מאושר" : business.status === "pending" ? "ממתין" : "נדחה"}
      </p>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <BusinessEditForm
          business={business}
          categories={categories}
          towns={towns}
          mode="admin"
          backHref="/admin/"
        />
      </div>
    </div>
  );
}
