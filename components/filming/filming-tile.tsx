"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { AlbumIcon, formatDuration, PlayIcon } from "@/components/filming/play-icon";
import { EyeIcon, formatViews, viewsLabel } from "@/components/filming/view-count";
import type { FilmingAsset } from "@/lib/filming/types";

type Slot = {
  colSm: string;
  colMd: string;
  shift: string;
  align: "start" | "center" | "end";
};

/**
 * Repeating placement pattern for the scattered layout. Items with a fixed
 * column start flow row by row, so each group reads as a staggered row.
 */
const SLOTS: Slot[] = [
  { colSm: "1 / span 3", colMd: "1 / span 3", shift: "0rem", align: "start" },
  { colSm: "4 / span 3", colMd: "5 / span 3", shift: "4rem", align: "center" },
  { colSm: "1 / span 3", colMd: "10 / span 3", shift: "1rem", align: "end" },
  { colSm: "4 / span 3", colMd: "3 / span 3", shift: "3rem", align: "end" },
  { colSm: "2 / span 4", colMd: "8 / span 3", shift: "0rem", align: "start" },
];

export function FilmingTile({
  asset,
  index,
  priority,
}: {
  asset: FilmingAsset;
  index: number;
  priority: boolean;
}) {
  const slot = SLOTS[index % SLOTS.length];
  const isVideo = asset.kind === "video";
  const isAlbum = asset.kind === "album";
  const landscape = asset.width > asset.height;
  const previewRef = useRef<HTMLVideoElement>(null);
  const duration = formatDuration(asset.durationSeconds);
  const hasViews = asset.views > 0;
  const label = [
    asset.title,
    isVideo ? `video${duration ? `, ${duration}` : ""}` : null,
    isAlbum ? `album, ${asset.itemCount} ${asset.itemCount === 1 ? "photo" : "photos"}` : null,
    hasViews ? viewsLabel(asset.views) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const startPreview = () => {
    const video = previewRef.current;
    if (!video || !window.matchMedia("(hover: hover)").matches) return;
    if (!video.src) video.src = asset.src;
    video.play().catch(() => {});
  };

  const stopPreview = () => {
    const video = previewRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <li
      className="film-tile"
      style={
        {
          "--col-sm": slot.colSm,
          "--col-md": slot.colMd,
          "--shift": slot.shift,
          "--i": Math.min(index, 12),
          justifySelf: slot.align,
          width: landscape ? "100%" : "82%",
        } as React.CSSProperties
      }
    >
      <Link
        href={`/filming/${asset.slug}`}
        scroll={false}
        aria-label={label}
        className="group relative block overflow-hidden bg-ink/5"
        onMouseEnter={isVideo ? startPreview : undefined}
        onMouseLeave={isVideo ? stopPreview : undefined}
        onFocus={isVideo ? startPreview : undefined}
        onBlur={isVideo ? stopPreview : undefined}
      >
        <Image
          src={isVideo ? (asset.posterSrc ?? asset.src) : asset.src}
          alt=""
          width={asset.width}
          height={asset.height}
          sizes="(min-width: 768px) 25vw, 50vw"
          priority={priority}
          placeholder={asset.blurDataUrl ? "blur" : "empty"}
          blurDataURL={asset.blurDataUrl ?? undefined}
          className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />

        {isVideo ? (
          <>
            <video
              ref={previewRef}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <PlayIcon className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 group-hover:opacity-0 md:size-14" />
          </>
        ) : null}

        {isAlbum ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/40 py-1 pl-1.5 pr-2 text-xs font-semibold tabular-nums text-paper backdrop-blur-sm"
          >
            <AlbumIcon className="size-4" />
            {asset.itemCount}
          </span>
        ) : null}

        {hasViews || duration ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/55 to-transparent px-2.5 pb-2 pt-8 text-xs font-semibold tabular-nums text-paper md:text-[0.8125rem]"
          >
            {hasViews ? (
              <span className="flex items-center gap-1.5 drop-shadow-sm">
                <EyeIcon className="size-4" />
                {formatViews(asset.views)}
              </span>
            ) : (
              <span />
            )}
            {duration ? <span className="drop-shadow-sm">{duration}</span> : null}
          </div>
        ) : null}
      </Link>

      {asset.description ? (
        <p className="mt-2.5 line-clamp-2 text-[0.8125rem] leading-snug text-muted md:text-sm">
          {asset.description}
        </p>
      ) : null}
    </li>
  );
}
