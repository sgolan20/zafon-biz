import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthCard, LoginForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "כניסה לבעלי עסקים",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin/" : "/account/");

  return (
    <AuthCard
      title="כניסה לבעלי עסקים"
      subtitle="היכנסו עם האימייל של העסק כדי לעדכן את הפרטים שלכם. פעם ראשונה כאן? לחצו על ״שכחתי סיסמה״ ותקבלו קישור לקביעת סיסמה."
    >
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  );
}
