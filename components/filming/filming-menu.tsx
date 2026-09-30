"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems, site } from "@/lib/site";

export function FilmingMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const { overflow } = document.body.style;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="filming-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="fixed left-1/2 top-4 z-40 grid size-11 -translate-x-1/2 place-items-center rounded-full text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`size-6 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <div
        id="filming-menu"
        hidden={!open}
        className="fixed inset-0 z-30 overflow-y-auto bg-paper px-6 pb-10 pt-24"
      >
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
        >
          <ul className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`font-display text-4xl font-semibold uppercase tracking-tight md:text-5xl ${
                      active ? "text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-16 font-display text-lg font-medium uppercase leading-snug md:text-xl">
            I&rsquo;m {site.name}, a programmer and filmmaker.
            <br />
            This is where my photography and film live.
          </p>
        </nav>
      </div>
    </>
  );
}
