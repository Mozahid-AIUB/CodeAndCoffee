"use client";

import { Check, Copy, KeyRound, Loader2, UserCheck, UserX, Users } from "lucide-react";
import { useState, useTransition } from "react";
import {
  resetUserPassword,
  setUserActive,
  setUserRole,
  type Credential,
  type UserResult,
} from "@/actions/users";

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "staff" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

const primary =
  "flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-fg transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-70";

export function UsersPanel({ users, meId }: { users: UserRow[]; meId: string }) {
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  function copyAll() {
    if (!creds) return;
    const text = creds.map((c) => `${c.name}\nEmail: ${c.email}\nTemporary password: ${c.password}`).join("\n\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted">{users.length} accounts. People register themselves; manage roles and access here.</p>
      </div>

      {creds && (
        <section className="rounded-card border border-success/40 bg-success/10 p-5" role="status">
          <h2 className="font-semibold">Share the new temporary password</h2>
          <p className="mt-1 text-sm text-muted">Passwords are shown only once. They must set a new password at next sign-in.</p>
          <ul className="mt-3 space-y-2">
            {creds.map((c) => (
              <li key={c.email} className="rounded-xl bg-surface p-3 text-sm">
                <p className="font-medium">{c.name}</p>
                <p>{c.email}</p>
                <p className="font-mono">{c.password}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={copyAll} className={`${primary} flex-1`}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy all"}
            </button>
            <button onClick={() => setCreds(null)} className="h-12 rounded-xl border border-border px-5 font-medium">
              Done
            </button>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Users className="size-5 text-accent" aria-hidden /> All users
        </h2>
        <ul className="space-y-3">
          {users.map((u) => (
            <UserItem key={u.id} u={u} isMe={u.id === meId} onCreds={(c) => setCreds(c)} onError={setError} />
          ))}
        </ul>
      </section>
    </main>
  );
}

function UserItem({
  u,
  isMe,
  onCreds,
  onError,
}: {
  u: UserRow;
  isMe: boolean;
  onCreds: (c: Credential[]) => void;
  onError: (e: string | null) => void;
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<UserResult>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) onError(res.error);
      else {
        onError(null);
        if (res.credentials) {
          onCreds(res.credentials);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });

  return (
    <li className={`rounded-2xl border border-border bg-surface p-4 ${u.is_active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {u.full_name} {isMe && <span className="text-xs text-muted">(you)</span>}
          </p>
          <p className="truncate text-sm text-muted">{u.email}</p>
          <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {!u.is_active && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-danger">Inactive</span>}
            {u.must_change_password && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-warning">Needs new password</span>}
          </p>
        </div>
        {pending && <Loader2 className="size-5 animate-spin text-muted" aria-hidden />}
      </div>
      {!isMe && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <select
            value={u.role}
            disabled={pending}
            onChange={(e) => run(() => setUserRole(u.id, e.target.value))}
            aria-label={`Role of ${u.full_name}`}
            className="h-11 rounded-xl border border-border bg-bg px-3 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <button
            disabled={pending}
            onClick={() => run(() => resetUserPassword(u.id))}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium transition hover:bg-surface-2 active:scale-95"
          >
            <KeyRound className="size-4" aria-hidden /> Reset password
          </button>
          <button
            disabled={pending}
            onClick={() => run(() => setUserActive(u.id, !u.is_active))}
            className={`flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition active:scale-95 ${u.is_active ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"}`}
          >
            {u.is_active ? <UserX className="size-4" aria-hidden /> : <UserCheck className="size-4" aria-hidden />}
            {u.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      )}
    </li>
  );
}
