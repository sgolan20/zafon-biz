import type { Metadata } from "next";
import { AuthCard, ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "קביעת סיסמה",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="קביעת סיסמה / שכחתי סיסמה"
      subtitle="הזינו את האימייל שרשום אצלנו לעסק, ונשלח אליו קישור לקביעת סיסמה חדשה."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
