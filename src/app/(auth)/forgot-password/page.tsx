import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll send a one-time code to get you back in.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
