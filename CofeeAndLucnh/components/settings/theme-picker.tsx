"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState, useTransition } from "react";
import { setTheme } from "@/actions/settings";
import { t } from "@/lib/messages";

type Theme = "light" | "dark" | "system";
const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: t.settings.light, Icon: Sun },
  { value: "dark", label: t.settings.dark, Icon: Moon },
  { value: "system", label: t.settings.system, Icon: Monitor },
];

export function ThemePicker({ initial }: { initial: Theme }) {
  const [theme, setLocal] = useState<Theme>(initial);
  const [, start] = useTransition();

  function pick(value: Theme) {
    setLocal(value);
    // apply instantly, then persist
    const root = document.documentElement;
    if (value === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", value);
    start(async () => void (await setTheme(value)));
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.settings.theme}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          onClick={() => pick(value)}
          className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition active:scale-95 ${
            theme === value ? "border-accent bg-accent text-accent-fg" : "border-border hover:bg-surface-2"
          }`}
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
