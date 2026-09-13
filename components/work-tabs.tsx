import Link from "next/link";
import { workTabs, type WorkTabValue } from "@/lib/site";

/**
 * Category tabs for the work list. Selecting a tab navigates to `?tab=…`, so
 * these are links marked with `aria-current` rather than ARIA tab widgets —
 * the tab role expects activation to swap a panel in place, not navigate.
 */
export function WorkTabs({ active }: { active: WorkTabValue }) {
  return (
    <nav aria-label="Filter work by category">
      <ul className="inline-flex items-center gap-1 rounded-full bg-card/50 p-1">
        {workTabs.map((tab) => {
          const selected = tab.value === active;

          return (
            <li key={tab.value}>
              <Link
                href={tab.href}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={`block rounded-full px-4 py-1.5 font-display text-sm transition-colors ${
                  selected
                    ? "bg-card font-medium text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
