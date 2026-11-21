import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessById, getCategories, getTowns } from "@/lib/db";
import { BusinessEditForm } from "@/components/BusinessEditForm";
import { BusinessImagesEditor } from "@/components/BusinessImagesEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "עריכת העסק",
  robots: { index: false, follow: false },
};

export default async function EditOwnBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login/?next=/account/business/${id}/`);

  const [business, categories, towns] = await Promise.all([
    getBusinessById(id),
    getCategories(),
    getTowns(),
  ]);
  if (!business || business.ownerId !== user.id) notFound();

  return (
    <div className="container-page py-10 sm:py-14 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">{business.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        עדכון פרטי העסק. השינויים מופיעים באתר מיד אחרי השמירה.
      </p>
      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-1">תמונות</h2>
        <p className="text-sm text-muted-foreground mb-3">
          התמונה הראשית והלוגו מופיעים בכרטיס של העסק באינדקס ובדף העסק.
        </p>
        <BusinessImagesEditor
          businessId={business.id}
          coverUrl={business.coverUrl}
          logoUrl={business.logoUrl}
        />
      </section>
      <h2 className="text-lg font-extrabold mb-3">פרטי העסק</h2>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <BusinessEditForm
          business={business}
          categories={categories}
          towns={towns}
          mode="owner"
          backHref="/account/"
        />
      </div>
    </div>
  );
}
