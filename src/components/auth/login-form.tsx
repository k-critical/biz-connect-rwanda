"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "./password-field";
import { rememberPendingEmail } from "./pending-email";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    setPending(true);
    setError(null);
    setUnverifiedEmail(null);
    const { error } = await authClient.signIn.email({
      email,
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      if (error.code === "EMAIL_NOT_VERIFIED") {
        rememberPendingEmail(email);
        setUnverifiedEmail(email);
      }
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function resendLink() {
    if (!unverifiedEmail) return;
    await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: "/verify-email/confirmed",
    });
    setResent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && (
        <Alert tone="error">
          <p>{error}</p>
          {unverifiedEmail &&
            (resent ? (
              <p>A new link is on its way. Check your inbox and spam folder.</p>
            ) : (
              <button
                type="button"
                onClick={resendLink}
                className="w-fit font-semibold text-primary underline underline-offset-4"
              >
                Send me a new confirmation link
              </button>
            ))}
        </Alert>
      )}
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <div className="flex flex-col gap-2">
        <PasswordField label="Password" name="password" autoComplete="current-password" />
        <Link
          href="/forgot-password"
          className="w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
