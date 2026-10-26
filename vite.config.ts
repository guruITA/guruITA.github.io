import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { CV_PDF_PATH, renderCvPdf } from './scripts/cv-pdf.mjs'

// The CV PDF is printed from the /cv/ page. The build writes it to dist/ (scripts/build-cv-pdf.mjs);
// in dev it does not exist, so Vite would answer with the HTML page and the browser would save that as a broken .pdf.
// This prints the page on request instead, so the download works in dev as well.
function cvPdfInDev(): Plugin {
  return {
    name: 'cv-pdf-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(CV_PDF_PATH, async (_req, res, next) => {
        try {
          const baseUrl = server.resolvedUrls?.local[0]
          if (!baseUrl) {
            throw new Error('dev server has no local URL yet')
          }
          const pdf = await renderCvPdf(baseUrl)
          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Cache-Control', 'no-store')
          res.end(pdf)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cvPdfInDev()],
  build: {
    rolldownOptions: {
      // two pages: the portfolio and the CV at /cv/ (printed to a PDF after the build)
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        cv: resolve(import.meta.dirname, 'cv/index.html'),
      },
    },
  },
})
