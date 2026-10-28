// Prints the built /cv/ page to a PDF per language in dist/cv/, so the PDFs always match the page.
// Runs after `vite build`.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { preview } from 'vite';
import { CV_PDF_PATHS, renderCvPdf } from './cv-pdf.mjs';

const dist = resolve(import.meta.dirname, '../dist');

const server = await preview({ preview: { port: 4180, open: false }, logLevel: 'warn' });
try {
    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) {
        throw new Error('vite preview did not report a local URL');
    }
    for (const [language, path] of Object.entries(CV_PDF_PATHS)) {
        const output = join(dist, path);
        const pdf = await renderCvPdf(baseUrl, language);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, pdf);
        console.log(`CV PDF (${language}) written to ${output}`);
    }
} finally {
    await server.close();
}
