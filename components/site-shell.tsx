import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/lib/site";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 justify-center px-4 py-6 sm:px-6 sm:py-10">
      <a
        href="#content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-6 focus-visible:top-6 focus-visible:rounded-lg focus-visible:bg-card focus-visible:px-4 focus-visible:py-2 focus-visible:font-display focus-visible:text-ink focus-visible:shadow-card"
      >
        Skip to content
      </a>
      <div className="w-full max-w-4xl rounded-card px-6 py-8 sm:px-10 sm:py-12 md:px-14 md:py-14">
        <div className="grid gap-8 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-14">
          <header className="md:sticky md:top-14 md:self-start">
            <Link
              href="/"
              className="font-display text-2xl font-semibold md:block md:text-right"
            >
              {site.name}
            </Link>
            <div className="mt-5 md:mt-9">
              <SiteNav />
            </div>
          </header>

          <main id="content" tabIndex={-1} className="min-w-0 focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
