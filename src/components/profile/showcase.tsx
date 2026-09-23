import type { BusinessProfile } from "@/server/services/directory-service";

export function Showcase({ sections }: { sections: BusinessProfile["business"]["showcase"] }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-sans text-xs font-bold tracking-widest text-ink-muted uppercase">
            {section.title}
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {section.items.map((item) => (
              <li key={item.name} className="flex items-baseline justify-between gap-6 py-3">
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-ink-muted">{item.description}</p>
                  )}
                </div>
                {item.price && (
                  <p className="shrink-0 font-semibold text-ink tabular-nums">{item.price}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
