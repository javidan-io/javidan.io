import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/filming/db/client";
import { mediaAssets } from "@/lib/filming/db/schema";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/** Counts one view. The client only calls this once per item per session. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return new Response(null, { status: 204 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT.test(userAgent)) {
    return new Response(null, { status: 204 });
  }

  const { slug } = await params;
  const [row] = await getDb()
    .update(mediaAssets)
    .set({ views: sql`${mediaAssets.views} + 1` })
    .where(
      and(
        eq(mediaAssets.slug, slug),
        eq(mediaAssets.published, true),
        isNull(mediaAssets.parentId),
      ),
    )
    .returning({ views: mediaAssets.views });

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(row);
}
