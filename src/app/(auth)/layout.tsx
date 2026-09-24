import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 items-start justify-center px-4 py-12 sm:items-center sm:py-16">
      <ImigongoPattern className="absolute inset-x-0 top-0 h-3 text-primary" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
