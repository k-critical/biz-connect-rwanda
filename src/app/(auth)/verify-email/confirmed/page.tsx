import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerification } from "@/components/auth/resend-verification";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Email confirmation" };

export default async function EmailConfirmedPage({
  searchParams,
}: PageProps<"/verify-email/confirmed">) {
  const { error } = await searchParams;

  if (error) {
    return (
      <AuthCard
        title="This link didn't work"
        description="Confirmation links work once, for 24 hours. Send yourself a fresh one."
      >
        <ResendVerification />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Your email is confirmed" description="Welcome to BizConnect Rwanda.">
      <Alert tone="success">
        <p>You&apos;re signed in and ready to go.</p>
      </Alert>
      <ButtonLink href="/account" size="lg">
        Go to your account
      </ButtonLink>
    </AuthCard>
  );
}
