// Creates or updates one confirmed user with a fixed password and role.
// Usage: node --env-file=.env.local scripts/seed-user.mjs <email> "<Full Name>" <staff|admin> <password>
import { createClient } from "@supabase/supabase-js";

const [email, name, role, password] = process.argv.slice(2);
if (!email || !name || !["staff", "admin"].includes(role) || !password) {
  throw new Error('Usage: seed-user.mjs <email> "<Full Name>" <staff|admin> <password>');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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
const { error } = await admin
  .from("profiles")
  .update({ role, full_name: name, is_active: true, must_change_password: false })
  .eq("id", id);
if (error) throw error;
console.log(`Ready: ${email} (${role})`);
