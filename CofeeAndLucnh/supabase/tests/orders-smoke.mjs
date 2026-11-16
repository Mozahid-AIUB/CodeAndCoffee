// Order flow smoke test: staff orders, limit of 3 pending, admin delivers, staff cannot see others.
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const check = (n, ok, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${n}${extra}`);

const mk = async (email) => {
  const { data } = await admin.auth.admin.createUser({ email, password: "TestPass123", email_confirm: true });
  const c = createClient(url, key, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: "TestPass123" });
  return { id: data.user.id, c };
};
const a = await mk("zz.a@manush.tech");
const b = await mk("zz.b@manush.tech");
const h = await mk("zz.h@manush.tech");
await admin.from("profiles").update({ role: "admin" }).eq("id", h.id);

const { data: drinks } = await a.c.from("drink_menu").select("id,name").eq("name", "Milk Tea");
const drink_id = drinks[0].id;
const ids = [];
for (let i = 0; i < 3; i++) {
  const r = await a.c.from("drink_orders").insert({ user_id: a.id, drink_id, sugar: "normal", milk: true }).select("id").single();
  check(`order ${i + 1} accepted`, !r.error); ids.push(r.data?.id);
}
const fourth = await a.c.from("drink_orders").insert({ user_id: a.id, drink_id });
check("4th pending order rejected", fourth.error?.message.includes("max_pending_orders"));
check("B cannot see A's orders", (await b.c.from("drink_orders").select("id")).data.length === 0);
check("admin sees all pending", (await h.c.from("drink_orders").select("id").eq("status", "pending")).data.length === 3);
const forge = await a.c.from("drink_orders").update({ status: "delivered" }).eq("id", ids[0]).select();
check("staff cannot mark delivered", !forge.data?.length);
const done = await h.c.from("drink_orders").update({ status: "delivered" }).eq("id", ids[0]).select("status,delivered_by,delivered_at").single();
check("admin marks Done (delivered_by set by DB)", done.data?.status === "delivered" && done.data.delivered_by === h.id && !!done.data.delivered_at);
const cancel = await a.c.from("drink_orders").update({ status: "cancelled" }).eq("id", ids[1]).select("status").single();
check("owner cancels pending order", cancel.data?.status === "cancelled");
const role = await a.c.from("profiles").update({ role: "admin" }).eq("id", a.id);
check("staff cannot promote self", !!role.error);

await admin.from("drink_orders").delete().in("user_id", [a.id, b.id, h.id]);
for (const u of [a, b, h]) await admin.auth.admin.deleteUser(u.id);
check("cleanup", (await admin.from("profiles").select("id").in("id", [a.id, b.id, h.id])).data.length === 0);
