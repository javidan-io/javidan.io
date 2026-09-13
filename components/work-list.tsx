import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/lib/content";
import { workCategoryLabel } from "@/lib/site";

const ICON_SIZE = 72;

function IconTile({ item }: { item: WorkItem }) {
  if (item.icon) {
    return (
      <Image
        src={item.icon}
        alt=""
        width={ICON_SIZE}
        height={ICON_SIZE}
        className="size-18 shrink-0 bg-black shadow-icon rounded-xs"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="flex size-18 shrink-0 items-center justify-center rounded-icon bg-page/50 font-display text-2xl font-semibold text-muted shadow-icon"
    >
      {item.title.charAt(0)}
    </div>
  );
}

function CategoryTag({ category }: { category: WorkItem["category"] }) {
  return (
    <span className="shrink-0 rounded-full bg-card/60 px-2.5 py-0.5 font-display text-xs text-muted">
      {workCategoryLabel(category)}
    </span>
  );
}

function RowBody({ item }: { item: WorkItem }) {
  return (
    <>
      <IconTile item={item} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="font-display text-xl font-medium transition-colors group-hover:text-accent-strong">
            {item.title}
          </h2>
          <CategoryTag category={item.category} />
        </div>
        <p className="mt-1 text-muted">{item.tagline}</p>
      </div>
    </>
  );
}

function WorkRow({ item }: { item: WorkItem }) {
  if (!item.href) {
    return (
      <li className="flex items-center gap-5 sm:gap-7">
        <RowBody item={item} />
      </li>
    );
  }

  const isExternal = /^https?:\/\//.test(item.href);

  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-center gap-5 sm:gap-7"
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        <RowBody item={item} />
      </Link>
    </li>
  );
}

export function WorkList({ items }: { items: WorkItem[] }) {
  return (
    <ul className="space-y-3 sm:space-y-6">
      {items.map((item) => (
        <WorkRow key={item.slug} item={item} />
      ))}
    </ul>
  );
}
