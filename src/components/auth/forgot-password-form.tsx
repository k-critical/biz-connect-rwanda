"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setStatus("pending");
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setStatus("idle");
      setError(authErrorMessage(error));
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <Alert tone="success">
        <p>
          If there&apos;s an account with that email, a reset link is on its way. It works for 1
          hour. Check your spam folder if it doesn&apos;t arrive in a few minutes.
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <Button type="submit" size="lg" loading={status === "pending"}>
        Send reset link
      </Button>
    </form>
  );
}
