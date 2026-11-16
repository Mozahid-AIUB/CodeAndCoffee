import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { getCurrentProfile } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");
  return (
    <AuthShell title={t.auth.changePassword} subtitle={t.auth.mustChange}>
      <ChangePasswordForm />
    </AuthShell>
  );
}
