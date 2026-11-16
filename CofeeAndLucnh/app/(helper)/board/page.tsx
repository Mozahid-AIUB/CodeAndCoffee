import type { Metadata } from "next";
import { LiveBoard } from "@/components/board/live-board";
import { dhakaDateString } from "@/lib/dates";
import { ORDER_SELECT, type OrderRow } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order board" };

export default async function BoardPage() {
  const supabase = await createClient();
  const sinceIso = new Date(`${dhakaDateString()}T00:00:00+06:00`).toISOString();
  const [p, d] = await Promise.all([
    supabase.from("drink_orders").select(ORDER_SELECT).eq("status", "pending").order("created_at"),
    supabase
      .from("drink_orders")
      .select(ORDER_SELECT)
      .eq("status", "delivered")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main>
      <LiveBoard
        initialPending={(p.data as unknown as OrderRow[] | null) ?? []}
        initialDelivered={(d.data as unknown as OrderRow[] | null) ?? []}
        sinceIso={sinceIso}
      />
    </main>
  );
}
