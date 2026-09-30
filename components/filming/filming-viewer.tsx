"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EyeIcon, viewsLabel } from "@/components/filming/view-count";
import type { FilmingAsset } from "@/lib/filming/types";

type FilmingViewerProps = {
  asset: FilmingAsset;
  /** An album's photos; empty for photos and videos. */
  items: FilmingAsset[];
  previousSlug: string | null;
  nextSlug: string | null;
  /** "modal": opened over the grid (close = back). "page": direct visit. */
  mode: "modal" | "page";
};

export function FilmingViewer({ asset, items, previousSlug, nextSlug, mode }: FilmingViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDivElement>(null);
  const views = useCountedViews(asset.slug, asset.views);

  const isAlbum = asset.kind === "album" && items.length > 0;
  const requested = Number(searchParams.get("photo") ?? 1) - 1;
  const photoIndex = isAlbum ? Math.min(Math.max(Number.isInteger(requested) ? requested : 0, 0), items.length - 1) : 0;
  const current = isAlbum ? items[photoIndex] : asset;

  const close = useCallback(() => {
    if (mode === "modal") router.back();
    else router.push("/filming", { scroll: false });
  }, [mode, router]);

  const go = useCallback(
    (slug: string | null) => {
      if (slug) router.replace(`/filming/${slug}`, { scroll: false });
    },
    [router],
  );

  // Album photos change client-side only; Next keeps useSearchParams in sync.
  const showPhoto = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      const url = index === 0 ? window.location.pathname : `?photo=${index + 1}`;
      window.history.replaceState(null, "", url);
    },
    [items.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") {
        if (isAlbum) showPhoto(photoIndex - 1);
        else go(previousSlug);
      } else if (event.key === "ArrowRight") {
        if (isAlbum) showPhoto(photoIndex + 1);
        else go(nextSlug);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go, showPhoto, isAlbum, photoIndex, previousSlug, nextSlug]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={asset.title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-paper text-ink focus:outline-none"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute left-1/2 top-4 z-10 grid size-11 -translate-x-1/2 place-items-center rounded-full"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-6 rotate-45">
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {isAlbum ? (
          <AlbumStrip items={items} activeIndex={photoIndex} onSelect={showPhoto} />
        ) : null}

        <div
          className={`relative mx-4 mt-16 flex min-h-0 flex-1 items-center justify-center md:mb-4 ${
            isAlbum ? "mb-3 md:ml-4 md:mr-20" : "mb-4 md:mx-20"
          }`}
        >
          <MediaStage item={current} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-6 px-4 pb-5 md:px-8">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold uppercase tracking-wide">
            {asset.title}
          </p>
          {asset.description ? (
            <p className="mt-1 max-w-prose text-sm text-muted">{asset.description}</p>
          ) : null}
          {views > 0 ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs tabular-nums text-muted">
              <EyeIcon className="size-3.5" />
              {viewsLabel(views)}
            </p>
          ) : null}
        </div>

        {isAlbum ? (
          <nav aria-label="Photos" className="flex shrink-0 items-center gap-2">
            <span className="mr-1 text-xs tabular-nums text-muted" aria-live="polite">
              {photoIndex + 1} / {items.length}
            </span>
            <StepButton
              label="Previous photo"
              direction="left"
              onClick={photoIndex > 0 ? () => showPhoto(photoIndex - 1) : null}
            />
            <StepButton
              label="Next photo"
              direction="right"
              onClick={photoIndex < items.length - 1 ? () => showPhoto(photoIndex + 1) : null}
            />
          </nav>
        ) : (
          <nav aria-label="Browse" className="flex shrink-0 gap-2">
            <StepLink slug={previousSlug} label="Previous" direction="left" />
            <StepLink slug={nextSlug} label="Next" direction="right" />
          </nav>
        )}
      </div>
    </div>
  );
}

function MediaStage({ item }: { item: FilmingAsset }) {
  if (item.kind === "video") {
    return (
      <video
        key={item.slug}
        src={item.src}
        poster={item.posterSrc ?? undefined}
        controls
        autoPlay
        playsInline
        preload="metadata"
        className="max-h-full max-w-full bg-ink"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      />
    );
  }

  return (
    <Image
      key={item.slug}
      src={item.src}
      alt={item.title}
      fill
      sizes="100vw"
      priority
      placeholder={item.blurDataUrl ? "blur" : "empty"}
      blurDataURL={item.blurDataUrl ?? undefined}
      className="object-contain"
    />
  );
}

/**
 * Thumbnails down the left edge (a row under the photo on phones), in the
 * same loose zig-zag as the reference; the active one steps out.
 */
function AlbumStrip({
  items,
  activeIndex,
  onSelect,
}: {
  items: FilmingAsset[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    refs.current[activeIndex]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <ol
      aria-label="Album photos"
      className="order-2 flex shrink-0 gap-2.5 overflow-x-auto px-4 pb-3 md:order-none md:w-36 md:flex-col md:gap-4 md:overflow-y-auto md:overflow-x-hidden md:py-16 md:pl-5 md:pr-0"
    >
      {items.map((item, index) => {
        const active = index === activeIndex;

        return (
          <li
            key={item.slug}
            className="album-thumb shrink-0"
            style={{ "--zig": ["0px", "14px", "4px", "18px", "8px"][index % 5] } as React.CSSProperties}
            data-active={active || undefined}
          >
            <button
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Photo ${index + 1} of ${items.length}`}
              aria-current={active ? "true" : undefined}
              className={`block overflow-hidden transition-opacity duration-300 ${
                active ? "opacity-100" : "opacity-55 hover:opacity-100"
              }`}
            >
              <Image
                src={item.kind === "video" ? (item.posterSrc ?? item.src) : item.src}
                alt=""
                width={item.width}
                height={item.height}
                sizes="96px"
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl ?? undefined}
                className="h-16 w-auto md:h-auto md:w-16"
              />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Records a view the first time an item is opened in this session and
 * returns the up-to-date count.
 */
function useCountedViews(slug: string, initial: number) {
  const [counted, setCounted] = useState<{ slug: string; views: number } | null>(null);

  useEffect(() => {
    const key = `filming-viewed:${slug}`;

    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count, just without per-session dedupe.
    }

    // Never aborted: the view must be recorded even if the viewer moves on.
    let active = true;

    fetch(`/api/filming/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      keepalive: true,
    })
      .then((response) => (response.status === 200 ? response.json() : null))
      .then((data: { views: number } | null) => {
        if (active && data) setCounted({ slug, views: data.views });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  return counted?.slug === slug ? counted.views : initial;
}

const stepClassName = "grid size-11 place-items-center rounded-full ring-1 ring-ink/15 transition-colors";

function StepIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function StepLink({
  slug,
  label,
  direction,
}: {
  slug: string | null;
  label: string;
  direction: "left" | "right";
}) {
  if (!slug) {
    return (
      <span aria-hidden className={`${stepClassName} opacity-30`}>
        <StepIcon direction={direction} />
      </span>
    );
  }

  return (
    <Link
      href={`/filming/${slug}`}
      replace
      scroll={false}
      aria-label={label}
      className={`${stepClassName} hover:bg-ink hover:text-paper`}
    >
      <StepIcon direction={direction} />
    </Link>
  );
}

function StepButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "left" | "right";
  onClick: (() => void) | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-label={label}
      className={`${stepClassName} hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30`}
    >
      <StepIcon direction={direction} />
    </button>
  );
}
