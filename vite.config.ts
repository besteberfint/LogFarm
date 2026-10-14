import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "form-action 'none'",
].join('; ')

// Geliştirme sunucusu HMR için gevşek kalır. CSP yalnız pakete giren index.html'e yazılır.
function productionCsp(): Plugin {
  return {
    name: 'logfarm-production-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) {
          return html
        }
        const meta = `    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />\n`
        return html.replace('<head>', `<head>\n${meta}`)
      },
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), productionCsp()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
