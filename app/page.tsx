import { getWorkItems } from "@/lib/content";

export default async function Home() {
  const items = await getWorkItems();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Work</h1>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.slug}>
            <span className="font-display font-medium">{item.title}</span>
            <span className="text-muted"> — {item.tagline}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
