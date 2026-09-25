import type { NextConfig } from "next";
import "./src/config/env";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Uploaded photos are stored ready-made in these widths; see src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [480, 960, 1600],
    imageSizes: [],
  },
  experimental: {
    serverActions: {
      // Photos are shrunk in the browser first, but a phone may still send an original.
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
