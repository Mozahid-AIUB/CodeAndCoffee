import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { FormError } from "@/components/ui/form";
import { t } from "@/lib/messages";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const { verify } = await searchParams;
  return (
    <AuthShell title={t.auth.welcomeBack} subtitle={t.auth.loginSubtitle}>
      {verify === "failed" && (
        <div className="mb-4">
          <FormError message={t.auth.verifyFailed} />
        </div>
      )}
      <LoginForm />
    </AuthShell>
  );
}
