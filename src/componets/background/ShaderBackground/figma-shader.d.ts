// Figma shader files loaded through the figma-shader-modules plugin in vite.config.ts.
declare module '*?figma-shader' {
    export function setup(device: GPUDevice, frame: object): void;
    export function render(device: GPUDevice, frame: object): void;
    export const definitions: Record<string, { defaultValue?: unknown }>;
}
