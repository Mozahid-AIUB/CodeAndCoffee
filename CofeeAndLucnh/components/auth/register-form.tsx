"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type FormState } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/ui/form";
import { t } from "@/lib/messages";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  if (state.success) {
    return (
      <div className="py-2 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">{t.auth.registerDone}</h2>
        <p className="mt-1.5 text-sm text-muted">{t.auth.registerDoneText}</p>
        <Link
          href="/login"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-accent font-medium text-accent-fg transition hover:bg-accent-hover"
        >
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  const fe = state.fieldErrors ?? {};
  return (
    <>
      <form action={action} className="space-y-4">
        <FormError message={state.error} />
        <Field label={t.auth.fullName} name="fullName" autoComplete="name" error={fe.fullName} required />
        <Field
          label={t.auth.email}
          name="email"
          type="email"
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          error={fe.email}
          required
        />
        <Field
          label={t.auth.password}
          name="password"
          type="password"
          autoComplete="new-password"
          error={fe.password}
          required
        />
        <Field
          label={t.auth.confirmPassword}
          name="confirm"
          type="password"
          autoComplete="new-password"
          error={fe.confirm}
          required
        />
        <SubmitButton pending={pending}>
          {pending ? t.auth.creating : t.auth.createAccount}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t.auth.login}
        </Link>
      </p>
    </>
  );
}
