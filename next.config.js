/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // MVP: cho phép ảnh HTTPS từ các nguồn RSS bên ngoài
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],

    // Trình duyệt tải ảnh trực tiếp, tránh CDN báo chặn optimizer
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;