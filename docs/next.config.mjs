import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // === DOCS TAB REDIRECTS ===
      // Getting Started (root → nested under docs)
      {
        source: '/docs/getting-started/:path*',
        destination: '/docs/docs/getting-started/:path*',
        permanent: true,
      },
      // Guides (from folder group → nested under docs)
      {
        source: '/docs/guides/:path*',
        destination: '/docs/docs/guides/:path*',
        permanent: true,
      },
      // Workflows (from folder group → nested under docs)
      {
        source: '/docs/workflows/:path*',
        destination: '/docs/docs/workflows/:path*',
        permanent: true,
      },
      // Examples (from folder group → nested under docs)
      {
        source: '/docs/examples/:path*',
        destination: '/docs/docs/examples/:path*',
        permanent: true,
      },
      // Integration (from advanced folder group → nested under docs)
      {
        source: '/docs/integration/:path*',
        destination: '/docs/docs/integration/:path*',
        permanent: true,
      },
      // Best Practices (from advanced folder group → nested under docs)
      {
        source: '/docs/best-practices/:path*',
        destination: '/docs/docs/best-practices/:path*',
        permanent: true,
      },
      // Advanced Topics (from advanced folder group → nested under docs)
      {
        source: '/docs/advanced/:path*',
        destination: '/docs/docs/advanced/:path*',
        permanent: true,
      },

      // === API TAB REDIRECTS ===
      // Reference → API consolidation
      {
        source: '/docs/reference/:path*',
        destination: '/docs/api/:path*',
        permanent: true,
      },
      // Tools Reference → API/Tools
      {
        source: '/docs/tools/:path*',
        destination: '/docs/api/tools/:path*',
        permanent: true,
      },
      // API Reference → API/OpenAPI
      {
        source: '/docs/api-reference/:path*',
        destination: '/docs/api/openapi/:path*',
        permanent: true,
      },

      // === DEPRECATED CONTENT ===
      // Tutorials → Getting Started
      {
        source: '/docs/tutorials/:path*',
        destination: '/docs/docs/getting-started/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
  serverExternalPackages: ['@takumi-rs/image-response'],
};

export default withMDX(config);
