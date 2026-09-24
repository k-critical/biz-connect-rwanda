import { Skeleton } from "@/components/ui/skeleton";

export function ListingSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="sr-only" role="status">
        Loading businesses…
      </p>
      <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      <Skeleton className="mt-6 h-5 w-40" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
