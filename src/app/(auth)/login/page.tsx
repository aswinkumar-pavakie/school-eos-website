import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your School EOS account.">
      <LoginForm />
    </AuthShell>
  );
}
