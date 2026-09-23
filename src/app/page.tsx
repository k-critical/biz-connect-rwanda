export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
        Milestone 0 · Foundations
      </p>
      <h1 className="text-4xl font-bold">BizConnect Rwanda</h1>
      <p className="max-w-md text-neutral-600 dark:text-neutral-400">
        The foundations are in place. The real design arrives in Milestone 1.
      </p>
      <a className="font-medium underline underline-offset-4" href="/api/health">
        Check system health
      </a>
    </main>
  );
}
