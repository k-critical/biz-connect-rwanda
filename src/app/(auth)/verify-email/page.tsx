import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerification } from "@/components/auth/resend-verification";

export const metadata: Metadata = { title: "Check your inbox" };

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Check your inbox"
      description="We've sent you a link to confirm your email address. Open it on this device to finish creating your account. It works for 24 hours."
    >
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 text-sm text-ink-muted">
        <MailCheck className="size-6 shrink-0 text-primary" aria-hidden />
        Nothing after a few minutes? Check your spam folder, or send a new link below.
      </div>
      <ResendVerification />
    </AuthCard>
  );
}
