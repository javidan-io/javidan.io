import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { WorkList } from "@/components/work-list";
import { getWorkItems } from "@/lib/content";
import { workListSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.name },
  description: site.tagline,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const items = await getWorkItems();

  return (
    <>
      <h1 className="sr-only">Work</h1>
      <WorkList items={items} />
      <JsonLd data={workListSchema(items)} />
    </>
  );
}
