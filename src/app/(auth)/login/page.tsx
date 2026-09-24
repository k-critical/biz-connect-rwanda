import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-links";
import { getSession } from "@/server/auth/session";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const returnTo = safeNextPath(Array.isArray(next) ? next[0] : next);
  if (await getSession()) redirect(returnTo);

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your listing and your account."
      footer={
        <>
          New to BizConnect Rwanda?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={returnTo} />
    </AuthCard>
  );
}
