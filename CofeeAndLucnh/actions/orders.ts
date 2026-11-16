"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/messages";
import { rateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

export type OrderResult = { ok: true } | { ok: false; error: string };

const orderSchema = z.object({
  drinkId: z.string().uuid(),
  sugar: z.enum(["none", "less", "normal", "more"]).nullable(),
  milk: z.boolean().nullable(),
  note: z.string().trim().max(140).nullable(),
});

function friendly(message: string): string {
  if (message.includes("max_pending_orders")) return t.order.limit;
  if (message.includes("drink not available")) return t.order.notAvailable;
  return t.common.error;
}

export async function placeOrder(input: z.input<typeof orderSchema>): Promise<OrderResult> {
  const profile = await requireProfile();
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t.common.error };
  if (!rateLimit(`order:${profile.id}`, 10, 60_000)) return { ok: false, error: t.order.slowDown };

  const supabase = await createClient();
  const { error } = await supabase.from("drink_orders").insert({
    user_id: profile.id,
    drink_id: parsed.data.drinkId,
    sugar: parsed.data.sugar,
    milk: parsed.data.milk,
    note: parsed.data.note || null,
  });
  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/home");
  revalidatePath("/history");
  return { ok: true };
}

export async function cancelOrder(orderId: string): Promise<OrderResult> {
  await requireProfile();
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: t.common.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("drink_orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending");
  if (error) return { ok: false, error: t.common.error };
  revalidatePath("/home");
  return { ok: true };
}

/** Admin (Timur bhai) only. The DB sets delivered_at + delivered_by. */
export async function markDelivered(orderId: string): Promise<OrderResult> {
  await requireProfile(["admin"]);
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: t.common.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("drink_orders")
    .update({ status: "delivered" })
    .eq("id", orderId)
    .eq("status", "pending");
  if (error) return { ok: false, error: t.common.error };
  return { ok: true };
}
