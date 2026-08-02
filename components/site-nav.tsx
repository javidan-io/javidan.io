"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      <ul className="flex flex-row flex-wrap items-center gap-x-6 gap-y-2 md:flex-col md:items-end md:gap-y-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`font-display text-lg transition-colors hover:text-ink ${
                  active ? "font-medium text-ink" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
