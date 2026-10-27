// The render loop of a fullscreen shader background, shared by the WebGPU city (figmaShaderHost)
// and its WebGL version (cityWebgl): the resolution the GPU keeps up, a frame rate cap, the canvas
// size and the mouse position.

import { createAdaptiveResolution } from '../adaptiveResolution';
import type { GpuBudget } from '../deviceProfile';
import { createFrameLimiter } from '../frameLimiter';
import { perfStats } from '../perfStats';

// 120 and 144 Hz screens would otherwise render the background twice as often
export const MAX_FPS = 60;

export interface LoopFrame {
    // canvas size in device pixels
    width: number;
    height: number;
    // ms since the loop started, and since the previous frame
    time: number;
    deltaTime: number;
    // pointer position in canvas pixels, null until the pointer moved
    mouse: { x: number; y: number } | null;
}

export interface ShaderLoopOptions {
    // the render resolution moves between these pixel ratios, depending on how fast the GPU is
    maxPixelRatio: number;
    minPixelRatio: number;
    budget: GpuBudget;
    // frame rate while idle() is true, to save battery when nothing moves
    idleFps: number;
    idle: () => boolean;
    // even the lowest resolution is far too slow for this device
    onTooSlow?: () => void;
}

// Draws on the canvas until the returned function is called
export function startShaderLoop(
    canvas: HTMLCanvasElement,
    draw: (frame: LoopFrame) => void,
    { maxPixelRatio, minPixelRatio, budget, idleFps, idle, onTooSlow }: ShaderLoopOptions,
): () => void {
    const maxRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const resolution = createAdaptiveResolution({
        maxRatio,
        minRatio: Math.min(minPixelRatio, maxRatio),
        ...budget,
        fps: MAX_FPS,
        onTooSlow,
    });
    const frame: LoopFrame = { width: 1, height: 1, time: 0, deltaTime: 0, mouse: null };

    const handlePointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / Math.max(rect.width, 1);
        frame.mouse = { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale };
    };

    // the CSS size is read on resize only; reading it every frame could force an extra layout
    let cssWidth = 0;
    let cssHeight = 0;
    const applySize = () => {
        const width = Math.max(1, Math.round(cssWidth * resolution.ratio));
        const height = Math.max(1, Math.round(cssHeight * resolution.ratio));
        // mobile toolbars fire resize while scrolling; skip when the size did not change
        if (width === canvas.width && height === canvas.height) {
            return;
        }
        canvas.width = width;
        canvas.height = height;
    };
    const handleResize = () => {
        cssWidth = canvas.clientWidth;
        cssHeight = canvas.clientHeight;
        resolution.setCssSize(cssWidth, cssHeight);
        applySize();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointer, { passive: true });

    let animationFrameId = 0;
    const start = performance.now();
    let last = start;
    const shouldRender = createFrameLimiter();
    const tick = (now: number) => {
        animationFrameId = requestAnimationFrame(tick);
        // every page frame counts, also those the background skips: at 30 fps idle a heavy background
        // can still pull the whole page down to 30 fps, which only shows between its own frames
        resolution.sample(now, MAX_FPS);
        if (!shouldRender(now, idle() ? idleFps : MAX_FPS)) {
            return;
        }
        // a no-op unless the resolution changed
        applySize();
        perfStats.backgroundRatio = resolution.ratio;
        frame.width = canvas.width;
        frame.height = canvas.height;
        frame.deltaTime = now - last;
        frame.time = now - start;
        last = now;
        draw(frame);
    };
    animationFrameId = requestAnimationFrame(tick);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', handlePointer);
    };
}
