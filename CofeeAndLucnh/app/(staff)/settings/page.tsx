import { KeyRound, Palette, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ThemePicker } from "@/components/settings/theme-picker";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/messages";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t.nav.settings}</h1>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UserRound className="size-5 text-accent" aria-hidden /> Profile
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Name</dt>
            <dd className="font-medium">{profile.full_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Email</dt>
            <dd className="truncate font-medium">{profile.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Role</dt>
            <dd className="font-medium capitalize">{profile.role === "admin" ? "Admin" : "Employee"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Palette className="size-5 text-accent" aria-hidden /> {t.settings.theme}
        </h2>
        <ThemePicker initial={profile.theme} />
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <KeyRound className="size-5 text-accent" aria-hidden /> {t.auth.changePassword}
        </h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
