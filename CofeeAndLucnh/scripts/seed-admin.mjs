// Creates (or promotes) the first admin. Email is auto-confirmed, no mail is sent.
// Usage: node --env-file=.env.local scripts/seed-admin.mjs
import { createClient } from "@supabase/supabase-js";

const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password, SEED_ADMIN_NAME: name = "Admin" } = process.env;
if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// the DB trigger only accepts company emails or allowlisted ones
const { data: row } = await admin.from("app_settings").select("value").eq("key", "email_allowlist").single();
const list = (row?.value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (!email.endsWith("@" + (process.env.ALLOWED_EMAIL_DOMAIN ?? "manush.tech")) && !list.includes(email)) {
  await admin.from("app_settings").update({ value: [...list, email].join(",") }).eq("key", "email_allowlist");
}

let id = (await admin.from("profiles").select("id").eq("email", email).maybeSingle()).data?.id;
if (!id) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  });
  if (error) throw error;
  id = data.user.id;
} else {
  await admin.auth.admin.updateUserById(id, { password, email_confirm: true });
}
const { error } = await admin.from("profiles").update({ role: "admin", is_active: true, must_change_password: false }).eq("id", id);
if (error) throw error;
console.log("Admin ready:", email);
