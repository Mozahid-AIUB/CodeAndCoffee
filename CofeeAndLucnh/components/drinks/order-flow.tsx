"use client";

import { Check, Coffee, Leaf, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { placeOrder } from "@/actions/orders";
import { t } from "@/lib/messages";

export type Drink = {
  id: string;
  name: string;
  category: string;
  has_sugar_option: boolean;
  has_milk_option: boolean;
};
type Sugar = "none" | "less" | "normal" | "more";
const SUGARS: Sugar[] = ["none", "less", "normal", "more"];

export function OrderFlow({ drinks }: { drinks: Drink[] }) {
  const [drink, setDrink] = useState<Drink | null>(null);
  const [sugar, setSugar] = useState<Sugar>("normal");
  const [milk, setMilk] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!drink) return;
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        drinkId: drink.id,
        sugar: drink.has_sugar_option ? sugar : null,
        milk: drink.has_milk_option ? milk : null,
        note: note.trim() || null,
      });
      if (res.ok) setPlaced(true);
      else setError(res.error);
    });
  }

  function reset() {
    setDrink(null);
    setNote("");
    setPlaced(false);
    setError(null);
  }

  if (placed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="rounded-card border border-border bg-surface p-8 text-center shadow-card"
        role="status"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
          className="mx-auto grid size-20 place-items-center rounded-full bg-success text-white"
        >
          <Check className="size-10" aria-hidden />
        </motion.div>
        <h2 className="mt-5 text-xl font-semibold">{t.drinks.placed}</h2>
        <p className="mt-1 text-sm text-muted">{drink?.name} is on its way to you.</p>
        <div className="mt-6 grid gap-3">
          <Link
            href="/home"
            className="flex h-12 items-center justify-center rounded-xl bg-accent font-medium text-accent-fg transition hover:bg-accent-hover active:scale-[0.98]"
          >
            {t.order.backHome}
          </Link>
          <button
            onClick={reset}
            className="h-12 rounded-xl border border-border font-medium transition hover:bg-surface-2 active:scale-[0.98]"
          >
            {t.order.another}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 font-semibold">{t.order.chooseDrink}</h2>
        <div className="grid grid-cols-2 gap-3">
          {drinks.map((d) => {
            const active = drink?.id === d.id;
            const Icon = d.category === "tea" ? Leaf : Coffee;
            return (
              <button
                key={d.id}
                onClick={() => setDrink(d)}
                aria-pressed={active}
                className={`flex min-h-24 flex-col items-start justify-between rounded-card border p-4 text-left transition active:scale-[0.97] ${
                  active
                    ? "border-accent bg-accent/10 ring-2 ring-accent"
                    : "border-border bg-surface hover:border-accent/50"
                }`}
              >
                <Icon className={`size-6 ${active ? "text-accent" : "text-muted"}`} aria-hidden />
                <span className="font-medium">{d.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {drink && (
          <motion.section
            key="options"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <h2 className="font-semibold">{t.order.customise}</h2>

            {drink.has_sugar_option && (
              <div>
                <p className="mb-2 text-sm font-medium">{t.drinks.sugar}</p>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t.drinks.sugar}>
                  {SUGARS.map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={sugar === s}
                      onClick={() => setSugar(s)}
                      className={`h-12 rounded-xl border text-sm font-medium transition active:scale-95 ${
                        sugar === s
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border hover:bg-surface-2"
                      }`}
                    >
                      {t.drinks.sugarLevels[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {drink.has_milk_option && (
              <div>
                <p className="mb-2 text-sm font-medium">{t.drinks.milk}</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.drinks.milk}>
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      role="radio"
                      aria-checked={milk === v}
                      onClick={() => setMilk(v)}
                      className={`h-12 rounded-xl border text-sm font-medium transition active:scale-95 ${
                        milk === v
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border hover:bg-surface-2"
                      }`}
                    >
                      {v ? t.drinks.withMilk : t.drinks.noMilk}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="note" className="mb-2 block text-sm font-medium">
                {t.drinks.note}
              </label>
              <input
                id="note"
                value={note}
                maxLength={140}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. extra hot"
                className="h-12 w-full rounded-xl border border-border bg-bg px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={pending}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-accent-fg transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-70"
            >
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {pending ? t.order.placing : `${t.order.confirm} · ${drink.name}`}
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
