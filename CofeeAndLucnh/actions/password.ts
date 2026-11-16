"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validators";
import type { FormState } from "./auth";

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");

  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { fieldErrors: { password: password.error.issues[0].message } };
  if (password.data !== formData.get("confirm")) {
    return { fieldErrors: { confirm: "Passwords do not match" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("different")
        ? "Choose a password different from the temporary one"
        : "Could not change the password. Please try again.",
    };
  }
  // The flag can only be cleared server-side (the DB blocks users from editing it).
  await createAdminClient().from("profiles").update({ must_change_password: false }).eq("id", profile.id);
  redirect("/home");
}
