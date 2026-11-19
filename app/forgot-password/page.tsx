import type { Metadata } from "next";
import { AuthCard, ForgotPasswordForm } from "@/components/auth/AuthForms";
import { emailEnabled } from "@/lib/notify";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "שכחתי סיסמה",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  const enabled = emailEnabled();
  return (
    <AuthCard
      eyebrow="קביעת סיסמה"
      title="שכחתם סיסמה?"
      subtitle={
        enabled
          ? "הזינו את האימייל שרשום אצלנו לעסק, ונשלח אליו קישור לקביעת סיסמה חדשה."
          : "זה קורה לכולם. גם אם העסק שלכם עבר אלינו מהאתר הקודם ועוד אין לכם סיסמה, נסדר לכם אחת."
      }
    >
      <ForgotPasswordForm emailEnabled={enabled} />
    </AuthCard>
  );
}
