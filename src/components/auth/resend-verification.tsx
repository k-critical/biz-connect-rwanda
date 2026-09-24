"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { readPendingEmail } from "./pending-email";

export function ResendVerification() {
  const emailInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fill in the address from this browser tab, if we have it and the field is still empty.
    if (emailInput.current && !emailInput.current.value) {
      emailInput.current.value = readPendingEmail();
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setStatus("pending");
    setError(null);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/verify-email/confirmed",
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
        <p>If that address is waiting to be confirmed, a new link is on its way.</p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        ref={emailInput}
        label="Your email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Button type="submit" variant="secondary" loading={status === "pending"}>
        Send a new link
      </Button>
    </form>
  );
}
