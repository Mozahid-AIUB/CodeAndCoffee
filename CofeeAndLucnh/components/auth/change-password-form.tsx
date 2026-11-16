"use client";

import { useActionState } from "react";
import type { FormState } from "@/actions/auth";
import { changePasswordAction } from "@/actions/password";
import { Field, FormError, SubmitButton } from "@/components/ui/form";
import { t } from "@/lib/messages";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label={t.auth.newPassword} name="password" type="password" autoComplete="new-password" error={fe.password} required />
      <Field label={t.auth.confirmPassword} name="confirm" type="password" autoComplete="new-password" error={fe.confirm} required />
      <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
    </form>
  );
}
