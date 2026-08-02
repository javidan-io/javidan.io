import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/lib/content";

const ICON_SIZE = 72;

function IconTile({ item }: { item: WorkItem }) {
  if (item.icon) {
    return (
      <Image
        src={item.icon}
        alt=""
        width={ICON_SIZE}
        height={ICON_SIZE}
        className="size-18 shrink-0 bg-black shadow-icon rounded-sm"
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

function RowBody({ item }: { item: WorkItem }) {
  return (
    <>
      <IconTile item={item} />
      <div className="min-w-0">
        <h2 className="font-display text-xl font-medium transition-colors group-hover:text-accent-strong">
          {item.title}
        </h2>
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

function MoreToCome() {
  return (
    <li className="flex items-center gap-5 sm:gap-7">
      <div
        aria-hidden
        className="flex size-18 shrink-0 items-center justify-center rounded-icon border-2 border-dashed border-hairline text-muted"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8"
        >
          <path d="M14.5 3.5 21 10l-2.5 2.5-2-2-8 8L5 21l-2-2 4.5-4.5 8-8-2-2z" />
          <path d="M12 6 9 3H4l3 3" />
        </svg>
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-medium text-muted">
          More to come
        </h2>
      </div>
    </li>
  );
}

export function WorkList({ items }: { items: WorkItem[] }) {
  return (
    <ul className="space-y-9 sm:space-y-11">
      {items.map((item) => (
        <WorkRow key={item.slug} item={item} />
      ))}
      <MoreToCome />
    </ul>
  );
}
