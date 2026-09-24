"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "./password-field";
import { rememberPendingEmail } from "./pending-email";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email,
      password: String(form.get("password")),
      callbackURL: "/verify-email/confirmed",
    });
    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }
    rememberPendingEmail(email);
    router.push("/verify-email");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField label="Your name" name="name" autoComplete="name" required maxLength={80} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters. A short sentence is easy to remember and hard to guess."
      />
      <Button type="submit" size="lg" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
