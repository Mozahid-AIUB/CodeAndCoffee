"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/ui/form";
import { t } from "@/lib/messages";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <>
      <form action={action} className="space-y-4">
        <FormError message={state.error} />
        <Field
          label={t.auth.email}
          name="email"
          type="email"
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        <Field
          label={t.auth.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton pending={pending}>
          {pending ? t.auth.signingIn : t.auth.login}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t.auth.createAccount}
        </Link>
      </p>
    </>
  );
}
