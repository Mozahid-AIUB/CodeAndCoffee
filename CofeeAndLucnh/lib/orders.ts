export type OrderRow = {
  id: string;
  status: "pending" | "delivered" | "cancelled";
  sugar: "none" | "less" | "normal" | "more" | null;
  milk: boolean | null;
  note: string | null;
  created_at: string;
  drink_id: string;
  drink: { name: string } | null;
  who?: { full_name: string } | null;
};

export const ORDER_SELECT =
  "id,status,sugar,milk,note,created_at,drink_id,drink:drink_menu(name),who:profiles!drink_orders_user_id_fkey(full_name)";

export const SUGAR_LABEL = { none: "No sugar", less: "Less sugar", normal: "Normal sugar", more: "More sugar" } as const;

export function describeOrder(o: Pick<OrderRow, "sugar" | "milk">): string {
  const parts: string[] = [];
  if (o.sugar) parts.push(SUGAR_LABEL[o.sugar]);
  if (o.milk !== null) parts.push(o.milk ? "With milk" : "No milk");
  return parts.join(" · ");
}

export function minutesAgo(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}
