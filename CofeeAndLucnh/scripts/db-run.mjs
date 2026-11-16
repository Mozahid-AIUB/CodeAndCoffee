// Runs SQL files against the hosted Supabase project via the Management API.
// Usage: node --env-file=.env.local scripts/db-run.mjs file1.sql [file2.sql ...]
import { readFileSync } from "node:fs";

const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token } = process.env;
if (!ref || !token) throw new Error("Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN");

for (const file of process.argv.slice(2)) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: readFileSync(file, "utf8") }),
  });
  const text = await res.text();
  console.log(`${res.ok ? "OK  " : "FAIL"} ${file}${res.ok ? "" : "\n" + text}`);
  if (!res.ok) process.exit(1);
}
