import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { CV_PDF_PATHS, renderCvPdf } from './scripts/cv-pdf.mjs'
import { figmaShaderToModule } from './scripts/figma-shader-module.mjs'

// The CV PDF is printed from the /cv/ page. The build writes it to dist/ (scripts/build-cv-pdf.mjs);
// in dev it does not exist, so Vite would answer with the HTML page and the browser would save that as a broken .pdf.
// This prints the page on request instead, so the download works in dev as well.
function cvPdfInDev(): Plugin {
  return {
    name: 'cv-pdf-in-dev',
    apply: 'serve',
    configureServer(server) {
      for (const [language, path] of Object.entries(CV_PDF_PATHS) as ['en' | 'nl', string][]) {
        server.middlewares.use(path, async (_req, res, next) => {
          try {
            const baseUrl = server.resolvedUrls?.local[0]
            if (!baseUrl) {
              throw new Error('dev server has no local URL yet')
            }
            const pdf = await renderCvPdf(baseUrl, language)
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Cache-Control', 'no-store')
            res.end(pdf)
          } catch (error) {
            next(error)
          }
        })
      }
    },
  }
}

// `import * as shader from './shader.ts?figma-shader'` loads a Figma shader file as a module
// with setup, render and definitions, while the file itself stays exactly as Figma exports it.
// Vite resolves the import to the real file with the query kept, so only load() is needed;
// no virtual module id, which breaks on Windows paths.
function figmaShaderModules(): Plugin {
  const query = '?figma-shader'
  return {
    name: 'figma-shader-modules',
    // before Vite's own loaders, which would otherwise read the file as plain TypeScript
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith(query)) {
        return null
      }
      return figmaShaderToModule(await readFile(id.slice(0, -query.length), 'utf8'))
    },
  }
}

// Content-Security-Policy for the built pages: scripts only from this site and Cloudflare Turnstile,
// fonts from Google Fonts, and network requests only to this site, Turnstile and the contact Worker.
// Injected script or a link to a strange host is then blocked by the browser.
// Dev has no policy, because Vite's hot reload runs inline scripts.
// GitHub Pages cannot send headers, so frame-ancestors (only valid as a header) is not possible here.
function contentSecurityPolicy(formEndpoint: string | undefined): Plugin {
  const formOrigin = formEndpoint ? new URL(formEndpoint).origin : ''
  const policy = [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' https://challenges.cloudflare.com ${formOrigin}`.trim(),
    'frame-src https://challenges.cloudflare.com',
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    cvPdfInDev(),
    figmaShaderModules(),
    contentSecurityPolicy(loadEnv(mode, process.cwd(), 'VITE_').VITE_CONTACT_FORM_ENDPOINT),
  ],
  build: {
    rolldownOptions: {
      // two pages: the portfolio and the CV at /cv/ (printed to a PDF after the build)
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        cv: resolve(import.meta.dirname, 'cv/index.html'),
      },
    },
  },
}))
