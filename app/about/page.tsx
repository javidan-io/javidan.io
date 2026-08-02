import type { Metadata } from "next";
import { getPage } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");

  return {
    title: page.title,
    description: page.description,
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
    </article>
  );
}
