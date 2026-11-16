"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validators";
import { t } from "@/lib/messages";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t.auth.invalid };

  const ip = await clientIp();
  if (
    !rateLimit(`login:ip:${ip}`, 20, 10 * 60_000) ||
    !rateLimit(`login:user:${parsed.data.email}`, 8, 10 * 60_000)
  ) {
    return { error: t.auth.tooMany };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") return { error: t.auth.emailNotVerified };
  if (error || !data.user) return { error: t.auth.invalid };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, must_change_password")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: t.auth.pendingOrDisabled };
  }
  redirect(profile.must_change_password ? "/change-password" : "/home");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] ??= issue.message;
    }
    return { fieldErrors };
  }

  if (!rateLimit(`register:ip:${await clientIp()}`, 5, 60 * 60_000)) {
    return { error: t.auth.tooMany };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  // DEVELOPMENT ONLY: until a mail provider (Resend) is configured, skip the email step.
  // Never active in production builds. The domain rule is still enforced by the database.
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
    const { error: createError } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError) {
      return createError.message.toLowerCase().includes("already")
        ? { fieldErrors: { email: "This email already has an account" } }
        : { error: t.common.error };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: t.common.error };
    redirect("/home");
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.APP_URL}/auth/confirm`,
    },
  });
  // Existing addresses also return success (Supabase hides whether an email is registered).
  if (error) return { error: t.common.error };

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
