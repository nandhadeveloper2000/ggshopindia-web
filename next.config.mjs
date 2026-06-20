/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Creates the static "out" folder for Amazon S3 deployment
  output: "export",
  trailingSlash: true,

  images: {
    // Required because S3 cannot run Next.js Image Optimization server
    unoptimized: true,

    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
