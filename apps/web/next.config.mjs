/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@sgc/ui", "@sgc/contracts", "@sgc/i18n"],
};

export default nextConfig;
