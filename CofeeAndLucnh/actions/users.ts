"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type Credential = { name: string; email: string; password: string };
export type UserResult =
  | { ok: true; credentials?: Credential[]; failed?: string[] }
  | { ok: false; error: string };

const roleSchema = z.enum(["staff", "admin"]);
const idSchema = z.string().uuid();

const tempPassword = () => randomBytes(9).toString("base64url");

async function guardTarget(id: string): Promise<{ error: string | null }> {
  const me = await requireProfile(["admin"]);
  if (!idSchema.safeParse(id).success) return { error: "Invalid user" };
  if (id === me.id) return { error: "You cannot change your own account here" };
  return { error: null };
}

export async function setUserActive(id: string, active: boolean): Promise<UserResult> {
  const g = await guardTarget(id);
  if (g.error) return { ok: false, error: g.error };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: "Could not update the user" };
  // also block sign-in at the auth layer while deactivated
  await admin.auth.admin.updateUserById(id, { ban_duration: active ? "none" : "876000h" });
  revalidatePath("/users");
  return { ok: true };
}

export async function setUserRole(id: string, role: string): Promise<UserResult> {
  const g = await guardTarget(id);
  if (g.error) return { ok: false, error: g.error };
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Invalid role" };
  const { error } = await createAdminClient().from("profiles").update({ role: parsed.data }).eq("id", id);
  if (error) return { ok: false, error: "Could not update the user" };
  revalidatePath("/users");
  return { ok: true };
}

export async function resetUserPassword(id: string): Promise<UserResult> {
  const g = await guardTarget(id);
  if (g.error) return { ok: false, error: g.error };
  const admin = createAdminClient();
  const password = tempPassword();
  const { data, error } = await admin.auth.admin.updateUserById(id, { password });
  if (error || !data.user) return { ok: false, error: "Could not reset the password" };
  await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
  const { data: p } = await admin.from("profiles").select("full_name,email").eq("id", id).single();
  revalidatePath("/users");
  return { ok: true, credentials: [{ name: p?.full_name ?? "", email: p?.email ?? "", password }] };
}
