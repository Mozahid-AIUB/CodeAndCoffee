import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { t } from "@/lib/messages";
import { describeOrder, type OrderRow } from "@/lib/orders";
import { CancelButton } from "./order-actions";

const STATUS = {
  pending: { label: t.drinks.pending, cls: "bg-warning/15 text-warning", Icon: Clock },
  delivered: { label: t.drinks.delivered, cls: "bg-success/15 text-success", Icon: CheckCircle2 },
  cancelled: { label: t.drinks.cancelled, cls: "bg-surface-2 text-muted", Icon: XCircle },
} as const;

export function OrderCard({ order, showDate }: { order: OrderRow; showDate?: boolean }) {
  const s = STATUS[order.status];
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{order.drink?.name ?? "Drink"}</p>
          <p className="text-sm text-muted">{describeOrder(order) || "-"}</p>
          {order.note && <p className="mt-1 text-sm italic text-muted">“{order.note}”</p>}
          <p className="mt-1 text-xs text-muted">
            {showDate ? `${formatDate(order.created_at)}, ` : ""}
            {formatTime(order.created_at)}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
          <s.Icon className="size-3.5" aria-hidden />
          {s.label}
        </span>
      </div>
      {order.status === "pending" && (
        <div className="mt-2 flex justify-end border-t border-border pt-2">
          <CancelButton orderId={order.id} />
        </div>
      )}
    </li>
  );
}
