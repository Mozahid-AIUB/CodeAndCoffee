"use client";

import { Bell, BellOff, CheckCheck, ChevronDown, Loader2, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { markDelivered } from "@/actions/orders";
import { formatTime } from "@/lib/dates";
import { t } from "@/lib/messages";
import { ORDER_SELECT, describeOrder, minutesAgo, type OrderRow } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.start(start);
      osc.stop(start + 0.17);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio not available */
  }
}

export function LiveBoard({
  initialPending,
  initialDelivered,
  sinceIso,
}: {
  initialPending: OrderRow[];
  initialDelivered: OrderRow[];
  sinceIso: string;
}) {
  const [pending, setPending] = useState(initialPending);
  const [delivered, setDelivered] = useState(initialDelivered);
  const [connected, setConnected] = useState(false);
  const [sound, setSound] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const soundRef = useRef(false);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [p, d] = await Promise.all([
      supabase.from("drink_orders").select(ORDER_SELECT).eq("status", "pending").order("created_at"),
      supabase
        .from("drink_orders")
        .select(ORDER_SELECT)
        .eq("status", "delivered")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false }),
    ]);
    if (p.data) setPending(p.data as unknown as OrderRow[]);
    if (d.data) setDelivered(d.data as unknown as OrderRow[]);
  }, [sinceIso]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("drink-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "drink_orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          if (soundRef.current) beep();
          navigator.vibrate?.([200, 100, 200]);
          setFlash(true);
          setTimeout(() => setFlash(false), 1200);
        }
        void refetch();
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void refetch();
      });
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearInterval(tick);
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const [busy, start] = useTransition();
  function done(id: string) {
    const prev = pending;
    setPending((list) => list.filter((o) => o.id !== id)); // optimistic
    start(async () => {
      const res = await markDelivered(id);
      if (!res.ok) setPending(prev); // rollback
      void refetch();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t.nav.board}</h1>
          <span className="grid min-w-8 place-items-center rounded-full bg-accent px-2.5 py-1 text-sm font-semibold text-accent-fg" aria-label={`${pending.length} pending`}>
            {pending.length}
          </span>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${connected ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
        >
          {connected ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
          {connected ? t.board.live : t.board.reconnecting}
        </span>
      </div>

      <button
        onClick={() => {
          setSound((s) => !s);
          if (!sound) beep();
        }}
        aria-pressed={sound}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-medium transition active:scale-[0.98] ${sound ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`}
      >
        {sound ? <Bell className="size-5" aria-hidden /> : <BellOff className="size-5" aria-hidden />}
        {sound ? "Sound on" : t.board.enableSound}
      </button>

      <motion.div animate={{ backgroundColor: flash ? "rgba(217,132,58,0.18)" : "rgba(0,0,0,0)" }} className="-mx-2 rounded-card p-2 transition">
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">{t.board.empty}</p>
        ) : (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            <AnimatePresence initial={false}>
              {pending.map((o) => {
                const mins = minutesAgo(o.created_at, now);
                return (
                  <motion.li
                    key={o.id}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-card border border-border bg-surface p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{o.who?.full_name ?? "Unknown"}</p>
                        <p className="mt-0.5 font-medium text-accent">{o.drink?.name}</p>
                        <p className="text-sm text-muted">{describeOrder(o) || "-"}</p>
                        {o.note && <p className="mt-1 text-sm italic">“{o.note}”</p>}
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted">
                        <p>{formatTime(o.created_at)}</p>
                        <p className={mins >= 10 ? "font-semibold text-danger" : ""}>
                          {t.board.waiting} {mins}m
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => done(o.id)}
                      disabled={busy}
                      className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-success text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
                    >
                      {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <CheckCheck className="size-5" aria-hidden />}
                      {t.common.done}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>

      <section>
        <button
          onClick={() => setShowDelivered((v) => !v)}
          aria-expanded={showDelivered}
          className="flex h-12 w-full items-center justify-between rounded-xl px-1 font-semibold"
        >
          <span>
            {t.board.deliveredToday} ({delivered.length})
          </span>
          <ChevronDown className={`size-5 transition ${showDelivered ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {showDelivered && (
          <ul className="space-y-2">
            {delivered.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{o.who?.full_name}</span> · {o.drink?.name}
                </span>
                <span className="text-muted">{formatTime(o.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
