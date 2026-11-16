import type { Metadata } from "next";
import { OrderCard } from "@/components/drinks/order-card";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso } from "@/lib/dates";
import { t } from "@/lib/messages";
import { ORDER_SELECT, type OrderRow } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const since = daysAgoIso(30);
  const { data } = await supabase
    .from("drink_orders")
    .select(ORDER_SELECT)
    .eq("user_id", profile.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  const orders = (data as unknown as OrderRow[] | null) ?? [];

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.nav.history}</h1>
        <p className="text-sm text-muted">{t.order.all30}</p>
      </div>
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {t.drinks.noOrders} ☕
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} showDate />
          ))}
        </ul>
      )}
    </main>
  );
}
