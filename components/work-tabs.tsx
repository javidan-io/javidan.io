import Link from "next/link";
import { workTabs, type WorkTabValue } from "@/lib/site";

/**
 * Category tabs for the work list. Selecting a tab navigates to `?tab=…`, so
 * these are links marked with `aria-current` rather than ARIA tab widgets —
 * the tab role expects activation to swap a panel in place, not navigate.
 *
 * The selected tab is bold and carries a dot beneath it. The dot is always in
 * the markup and merely transparent when inactive, so the row keeps its height
 * and nothing moves as the selection changes.
 */
export function WorkTabs({ active }: { active: WorkTabValue }) {
  return (
    <nav aria-label="Filter work by category">
      <ul className="flex items-center gap-6">
        {workTabs.map((tab) => {
          const selected = tab.value === active;

          return (
            <li key={tab.value}>
              <Link
                href={tab.href}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={`flex flex-col items-center gap-1.5 font-display text-sm ${
                  selected ? "font-semibold" : ""
                }`}
              >
                {tab.label}
                <span
                  aria-hidden
                  className={`size-1 rounded-full ${
                    selected ? "bg-ink" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
