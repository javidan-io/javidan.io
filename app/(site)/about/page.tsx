import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { getPage } from "@/lib/content";
import { personSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "profile",
      title: page.title,
      description: page.description,
      url: "/about",
    },
  };
}

export default async function About() {
  const page = await getPage("about");

  return (
    <article>
      <h1 className="font-display text-2xl font-semibold">{page.title}</h1>
      <div
        className="prose mt-6"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
      <JsonLd data={personSchema(page.description)} />
    </article>
  );
}
