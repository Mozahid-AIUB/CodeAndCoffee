// Smoke test for email auth rules against the hosted project (cleans up after itself).
// Usage: node --env-file=.env.local supabase/tests/auth-smoke.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const check = (name, ok) => console.log(`${ok ? "PASS" : "FAIL"} ${name}`);

// 1. foreign domain is rejected, even through the admin API
const bad = await admin.auth.admin.createUser({ email: "zz.outsider@gmail.com", password: "TestPass123", email_confirm: true });
check("non-company email rejected by DB trigger", !!bad.error);
if (bad.data?.user) await admin.auth.admin.deleteUser(bad.data.user.id);

// 2. company email: profile created, inactive until verified
const email = "zz.smoke@manush.tech";
const { data, error } = await admin.auth.admin.createUser({ email, password: "TestPass123", email_confirm: false });
check("company email accepted", !error);
const id = data.user.id;
let p = (await admin.from("profiles").select("is_active,email,full_name").eq("id", id).single()).data;
check("profile auto-created and inactive before verification", p?.is_active === false && p?.email === email);

// 3. verifying the email activates the profile
await admin.auth.admin.updateUserById(id, { email_confirm: true });
p = (await admin.from("profiles").select("is_active").eq("id", id).single()).data;
check("verification activates account", p?.is_active === true);

// 4. signed-in staff sees drinks but not other profiles
const s = await anon.auth.signInWithPassword({ email, password: "TestPass123" });
check("sign-in works", !s.error);
check("sees drink menu", (await anon.from("drink_menu").select("id")).data?.length === 6);
check("sees only own profile", (await anon.from("profiles").select("id")).data?.length === 1);

await admin.auth.admin.deleteUser(id);
check("cleanup", (await admin.from("profiles").select("id").eq("id", id)).data?.length === 0);
