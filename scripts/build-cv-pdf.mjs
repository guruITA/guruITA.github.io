// Prints the built /cv/ page to dist/cv/gurpreet-singh-cv.pdf, so the PDF always matches the page.
// Runs after `vite build`.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { preview } from 'vite';
import { CV_PDF_PATH, renderCvPdf } from './cv-pdf.mjs';

const output = join(resolve(import.meta.dirname, '../dist'), CV_PDF_PATH);

const server = await preview({ preview: { port: 4180, open: false }, logLevel: 'warn' });
try {
    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) {
        throw new Error('vite preview did not report a local URL');
    }
    const pdf = await renderCvPdf(baseUrl);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, pdf);
    console.log(`CV PDF written to ${output}`);
} finally {
    await server.close();
}
