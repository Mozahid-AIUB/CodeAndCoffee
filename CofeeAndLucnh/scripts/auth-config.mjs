// Pushes auth settings to the hosted Supabase project (Management API).
// Usage: node --env-file=.env.local scripts/auth-config.mjs [--templates]
import { readFileSync } from "node:fs";

const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token, APP_URL } = process.env;
if (!ref || !token || !APP_URL) throw new Error("Need SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, APP_URL");

const body = {
  disable_signup: false,
  mailer_autoconfirm: false,
  password_min_length: 8,
  site_url: APP_URL,
  uri_allow_list: `${APP_URL}/**`,
};
// Email templates need a custom SMTP provider (not allowed on the default Supabase mailer).
if (process.argv.includes("--templates")) {
  body.mailer_subjects_confirmation = "Verify your Manus Office email";
  body.mailer_templates_confirmation_content = readFileSync("supabase/email-confirm-template.html", "utf8");
}
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log(res.ok ? "OK auth config updated" : `FAIL ${res.status} ${await res.text()}`);
