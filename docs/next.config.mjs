import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@takumi-rs/image-response'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/docs',
        permanent: true,
      },
    ]
  }
};

export default withMDX(config);
