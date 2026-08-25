/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "via.placeholder.com"]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*"
      },
      {
        source: "/ws/:path*",
        destination: "http://127.0.0.1:8000/ws/:path*"
      }
    ];
  }
};

export default nextConfig;
