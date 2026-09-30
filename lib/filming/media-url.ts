/**
 * Resolves a bucket object key to a URL. With MEDIA_PUBLIC_URL set (MinIO
 * behind a public host) keys map to that host; otherwise to the local
 * placeholder copies under /public/filming/local.
 */
export function mediaUrl(key: string): string {
  const base = process.env.MEDIA_PUBLIC_URL?.replace(/\/+$/, "");
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return base ? `${base}/${encoded}` : `/filming/local/${encoded}`;
}
