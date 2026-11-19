import type { Metadata } from "next";
import Link from "next/link";
import { peekPasswordToken } from "@/lib/auth";
import { AuthCard, ErrorBox, ResetPasswordForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "קביעת סיסמה",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;
  const t = typeof token === "string" ? token : "";
  const email = t ? await peekPasswordToken(t) : null;

  return (
    <AuthCard title="קביעת סיסמה">
      {email ? (
        <ResetPasswordForm token={t} email={email} />
      ) : (
        <div className="space-y-4">
          <ErrorBox message="הקישור לא תקף, פג תוקפו או שכבר נוצל." />
          <Link href="/forgot-password/" className="block text-center text-primary hover:underline">
            בקשו קישור חדש
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
