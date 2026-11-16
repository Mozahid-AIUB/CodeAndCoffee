import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "staff" | "admin";
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  desk_location: string | null;
  theme: "light" | "dark" | "system";
  is_active: boolean;
  must_change_password: boolean;
};

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, desk_location, theme, is_active, must_change_password")
    .eq("id", auth.user.id)
    .single();
  return (data as Profile | null) ?? null;
}, );

/** Use at the top of protected layouts/pages. Re-checks role on the server. */
export async function requireProfile(roles?: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");
  if (profile.must_change_password) redirect("/change-password");
  if (roles && !roles.includes(profile.role)) redirect("/home");
  return profile;
}
