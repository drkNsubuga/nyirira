import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fully static build: emits ./out with a real index.html so it can be
  // served as-is by Cloudflare Pages (build output directory = "out").
  output: "export",
  // NOTE: `cacheComponents` and `partialPrefetching` (PPR) are incompatible
  // with `output: "export"`. This app is fully client-rendered, so neither
  // provides benefit here — static export is what Cloudflare Pages serves.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
