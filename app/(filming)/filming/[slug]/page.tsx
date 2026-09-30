import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilmingViewer } from "@/components/filming/filming-viewer";
import { getFilmingAsset } from "@/lib/filming/repository";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getFilmingAsset(slug);

  if (!result) return {};

  const { asset } = result;
  const image = asset.posterSrc ?? asset.src;

  return {
    title: asset.title,
    description: asset.description ?? `${asset.kind === "video" ? "Film" : "Photograph"} by Javidan.`,
    alternates: { canonical: `/filming/${asset.slug}` },
    openGraph: {
      title: asset.title,
      url: `/filming/${asset.slug}`,
      images: [{ url: image, width: asset.width, height: asset.height }],
      ...(asset.kind === "video" ? { videos: [{ url: asset.src }] } : {}),
    },
  };
}

/** Direct visit or shared link: the viewer is the whole page. */
export default async function FilmingViewerPage({ params }: Props) {
  const { slug } = await params;
  const result = await getFilmingAsset(slug);

  if (!result) notFound();

  return (
    <>
      <h1 className="sr-only">{result.asset.title}</h1>
      <FilmingViewer
        asset={result.asset}
        items={result.items}
        previousSlug={result.previous?.slug ?? null}
        nextSlug={result.next?.slug ?? null}
        mode="page"
      />
    </>
  );
}
