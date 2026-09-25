import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Your dashboard", template: "%s · Dashboard · BizConnect Rwanda" },
  robots: { index: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">{children}</div>;
}
