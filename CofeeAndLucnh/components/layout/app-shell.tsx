import { ClipboardList, Coffee, History, Home, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import type { Profile } from "@/lib/auth";
import { t } from "@/lib/messages";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const initials = profile.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = [
    { href: "/home", label: t.nav.home, Icon: Home },
    { href: "/drinks/new", label: "Order", Icon: Coffee },
    { href: "/history", label: t.nav.history, Icon: History },
    ...(profile.role === "admin"
      ? [
          { href: "/board", label: t.nav.board, Icon: ClipboardList },
          { href: "/users", label: t.nav.users, Icon: Users },
        ]
      : []),
  ];

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28">
      <header className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between border-b border-border bg-bg/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{profile.full_name}</p>
            <p className="text-xs capitalize text-muted">{profile.role}</p>
          </div>
        </div>
        <div className="flex items-center">
        <Link
          href="/settings"
          aria-label={t.nav.settings}
          className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg active:scale-95"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label={t.auth.logout}
            className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg active:scale-95"
          >
            <LogOut className="size-5" aria-hidden />
          </button>
        </form>
        </div>
      </header>

      {children}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-2xl">
          {nav.map(({ href, label, Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted transition hover:text-accent active:scale-95"
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
