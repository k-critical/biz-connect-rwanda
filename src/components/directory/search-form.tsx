import Form from "next/form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SearchForm({
  defaultValue,
  size = "md",
  className,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Form action="/explore" role="search" className={cn("flex w-full gap-2", className)}>
      <label htmlFor="site-search" className="sr-only">
        Search businesses
      </label>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search a name, dish, service or place"
          className={cn(
            "w-full rounded-lg border border-border-strong bg-surface pr-3 pl-11 text-base text-ink placeholder:text-ink-subtle",
            size === "lg" ? "h-14" : "h-11",
          )}
        />
      </div>
      <Button
        type="submit"
        size={size === "lg" ? "lg" : "md"}
        className={size === "lg" ? "h-14" : ""}
      >
        Search
      </Button>
    </Form>
  );
}
