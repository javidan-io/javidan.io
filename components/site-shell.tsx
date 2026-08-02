import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/lib/site";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-4xl rounded-card bg-card px-6 py-8 shadow-card sm:px-10 sm:py-12 md:px-14 md:py-14">
        <div className="grid gap-8 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-14">
          <header className="md:sticky md:top-14 md:self-start">
            <Link
              href="/"
              className="font-display text-2xl font-semibold text-accent md:block md:text-right"
            >
              {site.name}
            </Link>
            <div className="mt-5 md:mt-9">
              <SiteNav />
            </div>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
