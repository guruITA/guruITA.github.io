// Turns a Figma shader (its unchanged main.ts, e.g. shaders/city-shader.ts) into a normal ES module.
// Figma provides `defineProperties` from "figma:shaders"; here a local stand-in records the property
// definitions and the module exports them next to setup() and render().
// This runs at build time, so the page needs no eval or new Function, which the Content-Security-Policy blocks.

const FIGMA_IMPORT = /^\s*import\s*\{\s*defineProperties\s*\}\s*from\s*["']figma:shaders["'];?\s*$/m;

/**
 * Rewrites the source of a Figma shader into a module that exports setup, render and definitions.
 *
 * @param {string} source - The shader file as Figma exports it.
 * @returns {string} JavaScript module code.
 */
export function figmaShaderToModule(source) {
    if (!FIGMA_IMPORT.test(source)) {
        throw new Error('Figma shader has no `import { defineProperties } from "figma:shaders"` line');
    }
    const body = source.replace(FIGMA_IMPORT, '');
    return [
        'let definitions = {};',
        // Figma calls this with the Effect function and its properties; only the properties matter here.
        'const defineProperties = (_effect, properties) => { definitions = properties; };',
        body,
        'export { definitions };',
        '',
    ].join('\n');
}
