import { notFound } from "next/navigation";
import { FilmingViewer } from "@/components/filming/filming-viewer";
import { getFilmingAsset } from "@/lib/filming/repository";

/** Opened from the grid: the viewer overlays the gallery. */
export default async function FilmingViewerModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getFilmingAsset(slug);

  if (!result) notFound();

  return (
    <FilmingViewer
      asset={result.asset}
      items={result.items}
      previousSlug={result.previous?.slug ?? null}
      nextSlug={result.next?.slug ?? null}
      mode="modal"
    />
  );
}
