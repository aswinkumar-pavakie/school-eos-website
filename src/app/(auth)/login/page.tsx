import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-text">School EOS</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to your account.</p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
