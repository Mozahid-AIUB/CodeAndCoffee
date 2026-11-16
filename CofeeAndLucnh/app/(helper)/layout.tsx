import { AppShell } from "@/components/layout/app-shell";
import { requireProfile } from "@/lib/auth";

export default async function HelperLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile(["admin"]);
  return <AppShell profile={profile}>{children}</AppShell>;
}
