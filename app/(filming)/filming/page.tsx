import type { Metadata } from "next";
import { FilmingGrid } from "@/components/filming/filming-grid";
import { getFilmingAssets } from "@/lib/filming/repository";

export const metadata: Metadata = {
  title: "Filming",
  description: "Photography and film by Javidan.",
  alternates: { canonical: "/filming" },
};

export default async function FilmingPage() {
  const assets = await getFilmingAssets();

  return (
    <>
      <h1 className="sr-only">Filming</h1>
      <FilmingGrid assets={assets} />
    </>
  );
}
