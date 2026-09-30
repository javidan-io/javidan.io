import { FilmingTile } from "@/components/filming/filming-tile";
import type { FilmingAsset } from "@/lib/filming/types";

export function FilmingGrid({ assets }: { assets: FilmingAsset[] }) {
  return (
    <ul className="film-grid mx-auto w-full max-w-7xl px-4 pb-40 pt-28 sm:px-8 md:pt-36">
      {assets.map((asset, index) => (
        <FilmingTile
          key={asset.slug}
          asset={asset}
          index={index}
          priority={index < 5}
        />
      ))}
    </ul>
  );
}
