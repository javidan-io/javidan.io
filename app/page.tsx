import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { WorkList } from "@/components/work-list";
import { WorkTabs } from "@/components/work-tabs";
import { getWorkItems } from "@/lib/content";
import { workListSchema } from "@/lib/schema";
import { resolveWorkTab, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.name },
  description: site.tagline,
  alternates: { canonical: "/" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [items, params] = await Promise.all([getWorkItems(), searchParams]);
  const active = resolveWorkTab(params.tab);
  const visible =
    active === "all"
      ? items
      : items.filter((item) => item.category === active);

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <h1 className="font-display text-2xl font-semibold">My Work</h1>
        <div className="mt-4">
          <WorkTabs active={active} />
        </div>
      </header>

      <WorkList items={visible} />
      <JsonLd data={workListSchema(visible)} />
    </>
  );
}
