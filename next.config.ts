import type { NextConfig } from "next";

// Allow next/image to optimise media served from MinIO (MEDIA_PUBLIC_URL).
const mediaUrl = process.env.MEDIA_PUBLIC_URL
  ? new URL(process.env.MEDIA_PUBLIC_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaUrl
      ? [
          {
            protocol: mediaUrl.protocol.replace(":", "") as "http" | "https",
            hostname: mediaUrl.hostname,
            port: mediaUrl.port,
            pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**`,
          },
        ]
      : [],
    // Local MinIO runs on localhost, which Next blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
