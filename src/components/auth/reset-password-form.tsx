"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { PasswordField } from "./password-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = String(new FormData(event.currentTarget).get("password"));
    setStatus("pending");
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) {
      setStatus("idle");
      setError(authErrorMessage(error));
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success">
          <p>Your password has been changed, and any other devices have been signed out.</p>
        </Alert>
        <ButtonLink href="/login" size="lg">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <Button type="submit" size="lg" loading={status === "pending"}>
        Save new password
      </Button>
    </form>
  );
}
