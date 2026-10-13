import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { appBaseRedirect } from './appBaseRedirect.ts'

const appBaseRedirectPlugin = (): Plugin => ({
  name: 'app-base-redirect',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const location = appBaseRedirect(request.url)
      if (!location) return next()
      response.writeHead(302, { Location: location })
      response.end()
    })
  },
})

export default defineConfig({
  base: '/app/',
  plugins: [react(), appBaseRedirectPlugin()],
  server: { fs: { allow: ['..'] } },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
})
