import type { NextConfig } from "next";

// Cloudflare Pages (and any static host) builds with whatever env vars exist
// AT BUILD TIME — NEXT_PUBLIC_* values are inlined into the bundle here, so a
// build without them produces a bundle that can never call the live API.
// Warn loudly so misconfiguration is visible in the build logs instead of
// surfacing only as a runtime "credentials missing" error in the browser.
if (
  process.env.NEXT_PUBLIC_USE_REAL_API === "true" &&
  (!process.env.NEXT_PUBLIC_YOUCAM_API_KEY ||
    !process.env.NEXT_PUBLIC_YOUCAM_API_URL)
) {
  const missing = [
    !process.env.NEXT_PUBLIC_YOUCAM_API_KEY && "NEXT_PUBLIC_YOUCAM_API_KEY",
    !process.env.NEXT_PUBLIC_YOUCAM_API_URL && "NEXT_PUBLIC_YOUCAM_API_URL",
  ]
    .filter(Boolean)
    .join(", ");
  console.warn(
    `\n[nyirira] Live YouCam API enabled but credentials missing: ${missing}\n` +
      "  NEXT_PUBLIC_* vars are inlined into the static bundle at build time.\n" +
      "  On Cloudflare Pages: Settings -> Environment variables -> set for the\n" +
      "  correct environment (Production AND Preview) -> then REDEPLOY.\n" +
      "  wrangler.toml [vars] are NOT used by this static export.\n"
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  // Fully static build: emits ./out with a real index.html so it can be
  // served as-is by Cloudflare Pages (build output directory = "out").
  output: "export",
  // Disable Next.js Image Optimization API (incompatible with output: "export").
  // <Image /> tags will render as plain  with the src passed through.
  images: {
    unoptimized: true,
  },
  // NOTE: `cacheComponents` and `partialPrefetching` (PPR) are incompatible
  // with `output: "export"`. This app is fully client-rendered, so neither
  // provides benefit here — static export is what Cloudflare Pages serves.
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    agentUpgrade: "security",
  },
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
