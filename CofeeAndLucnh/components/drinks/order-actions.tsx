"use client";

import { Loader2, RotateCw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { cancelOrder, placeOrder } from "@/actions/orders";
import { t } from "@/lib/messages";

export function CancelButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => void (await cancelOrder(orderId)))}
      className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-danger transition hover:bg-danger/10 active:scale-95 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <X className="size-4" aria-hidden />}
      {t.drinks.cancelOrder}
    </button>
  );
}

export function UsualButton({
  drinkId,
  sugar,
  milk,
  label,
}: {
  drinkId: string;
  sugar: "none" | "less" | "normal" | "more" | null;
  milk: boolean | null;
  label: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await placeOrder({ drinkId, sugar, milk, note: null });
            setMsg(res.ok ? t.drinks.placed : res.error);
          })
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-fg/15 font-medium transition hover:bg-accent-fg/25 active:scale-[0.98] disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
        {t.drinks.orderUsual} · {label}
      </button>
      {msg && (
        <p role="status" className="mt-2 text-center text-sm opacity-90">
          {msg}
        </p>
      )}
    </div>
  );
}
