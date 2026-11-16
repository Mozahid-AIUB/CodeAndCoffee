"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setTheme(theme: string): Promise<{ ok: boolean }> {
  const profile = await requireProfile();
  const parsed = z.enum(["light", "dark", "system"]).safeParse(theme);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ theme: parsed.data }).eq("id", profile.id);
  if (error) return { ok: false };

  (await cookies()).set("theme", parsed.data, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
