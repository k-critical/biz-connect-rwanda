import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { ButtonLink } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      <ImigongoPattern className="absolute top-0 right-0 hidden h-full w-40 text-surface-2 lg:block" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Milestone 1 · Design system
        </p>
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          Every local business, one tap away.
        </h1>
        <p className="max-w-xl text-lg text-ink-muted">
          The look and building blocks are ready. Real listings arrive with the public directory in
          Milestone 3.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <ButtonLink href="/styleguide" variant="secondary">
            Open the style guide
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
