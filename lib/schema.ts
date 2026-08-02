import type { WorkItem } from "@/lib/content";
import { site } from "@/lib/site";

const absolute = (path: string) => new URL(path, site.url).toString();

export function personSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    description,
  };
}

export function workListSchema(items: WorkItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Work",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": item.type,
        name: item.title,
        description: item.tagline,
        author: { "@type": "Person", name: site.name },
        ...(item.href ? { url: item.href } : {}),
        ...(item.icon ? { image: absolute(item.icon) } : {}),
      },
    })),
  };
}
