export const CV_PDF_PATHS: Record<'en' | 'nl', string>;
export function renderCvPdf(baseUrl: string, language: 'en' | 'nl'): Promise<Buffer>;
