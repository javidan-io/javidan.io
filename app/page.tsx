import { WorkList } from "@/components/work-list";
import { getWorkItems } from "@/lib/content";

export default async function Home() {
  const items = await getWorkItems();

  return (
    <>
      <h1 className="sr-only">Work</h1>
      <WorkList items={items} />
    </>
  );
}
