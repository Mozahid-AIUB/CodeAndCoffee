import type { Metadata } from "next";
import { UsersPanel, type UserRow } from "@/components/admin/users-panel";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,is_active,must_change_password,created_at")
    .order("created_at", { ascending: false });
  return <UsersPanel users={(data as UserRow[] | null) ?? []} meId={me.id} />;
}
