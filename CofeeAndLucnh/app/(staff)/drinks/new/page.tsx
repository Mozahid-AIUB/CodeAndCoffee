import type { Metadata } from "next";
import { OrderFlow, type Drink } from "@/components/drinks/order-flow";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order a drink" };

export default async function NewDrinkPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("drink_menu")
    .select("id,name,category,has_sugar_option,has_milk_option")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t.drinks.orderTitle}</h1>
      <OrderFlow drinks={(data as Drink[] | null) ?? []} />
    </main>
  );
}
