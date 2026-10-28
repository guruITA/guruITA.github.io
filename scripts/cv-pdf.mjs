// Prints the CV page to a PDF; shared by the build (scripts/build-cv-pdf.mjs) and the dev server (vite.config.ts),
// so the download is the page itself everywhere. Needs Playwright's Chromium:
// npx playwright install chromium-headless-shell
// One PDF per language of the site (src/cv/CvPage.tsx links to the same paths)
export const CV_PDF_PATHS = {
    en: '/cv/gurpreet-singh-cv.pdf',
    nl: '/cv/gurpreet-singh-cv-nl.pdf',
};

export async function renderCvPdf(baseUrl, language) {
    // loaded here, so importing CV_PDF_PATHS (vite.config.ts) does not load Playwright
    const { chromium } = await import('playwright').catch((error) => {
        // node_modules is not synced between machines, so a fresh checkout may not have it yet
        throw new Error(
            `Playwright is missing from node_modules on this machine; run: npm install && npx playwright install chromium-headless-shell\n${error.message}`,
        );
    });
    const browser = await chromium.launch().catch((error) => {
        throw new Error(
            `Could not start Chromium for the CV PDF; install it once with: npx playwright install chromium-headless-shell\n${error.message}`,
        );
    });
    try {
        const page = await browser.newPage();
        // the page reads the language the visitor picked from storage (src/i18n/language.ts)
        await page.addInitScript((value) => localStorage.setItem('language', value), language);
        await page.goto(new URL('cv/', baseUrl).href, { waitUntil: 'networkidle' });
        // the PDF should use Arimo, not the fallback font
        await page.evaluate(() => document.fonts.ready);
        return await page.pdf({ preferCSSPageSize: true, printBackground: true });
    } finally {
        await browser.close();
    }
}
