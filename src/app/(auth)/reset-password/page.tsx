import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  const resetToken = Array.isArray(token) ? token[0] : token;

  if (error || !resetToken) {
    return (
      <AuthCard
        title="This link didn't work"
        description="Reset links work once, for 1 hour. Request a new one and use it straight away."
      >
        <ButtonLink href="/forgot-password" size="lg">
          Send a new reset link
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={resetToken} />
    </AuthCard>
  );
}
