import { Clock, Coffee, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { OrderCard } from "@/components/drinks/order-card";
import { UsualButton } from "@/components/drinks/order-actions";
import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/messages";
import { ORDER_SELECT, describeOrder, type OrderRow } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("drink_orders")
    .select(ORDER_SELECT)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const orders = (data as unknown as OrderRow[] | null) ?? [];
  const active = orders.filter((o) => o.status === "pending");
  const usual = orders.find((o) => o.status !== "cancelled");
  const past = orders.filter((o) => o.status !== "pending").slice(0, 4);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <main className="space-y-5">
      <section>
        <p className="text-sm text-muted">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hello, {firstName} 👋</h1>
      </section>

      <section className="rounded-card bg-accent p-5 text-accent-fg shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t.drinks.orderTitle}</h2>
            <p className="mt-1 text-sm opacity-85">Pick a drink and we&apos;ll bring it to you.</p>
          </div>
          <Coffee className="size-8 shrink-0 opacity-90" aria-hidden />
        </div>
        <Link
          href="/drinks/new"
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-accent-fg font-semibold text-accent transition active:scale-[0.98]"
        >
          {t.drinks.orderTitle}
        </Link>
        {usual?.drink && (
          <div className="mt-3">
            <UsualButton
              drinkId={usual.drink_id}
              sugar={usual.sugar}
              milk={usual.milk}
              label={`${usual.drink.name}${describeOrder(usual) ? ` (${describeOrder(usual)})` : ""}`}
            />
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t.order.activeOrders}</h2>
          <ul className="space-y-3">
            {active.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <UtensilsCrossed className="size-5 text-accent" aria-hidden />
            {t.meals.tomorrow}
          </h2>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
            Coming soon
          </span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Clock className="size-4" aria-hidden />
          {t.meals.noMenu}
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t.order.recent}</h2>
          <Link href="/history" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        {past.length === 0 && active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.drinks.noOrders} ☕
          </p>
        ) : (
          <ul className="space-y-3">
            {past.map((o) => (
              <OrderCard key={o.id} order={o} showDate />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
