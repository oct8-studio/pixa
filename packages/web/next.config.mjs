/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        sharp: 'empty',
      }
    }
    return config
  }
}

export default nextConfig
