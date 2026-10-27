// Runs a Figma shader (its unchanged main.ts from the Figma library) on a canvas.
// The shader receives the same frame object Figma gives it: output, params, state, time and mouse.

import { createFrameLimiter } from '../frameLimiter';

type ShaderParams = Record<string, unknown>;

interface ShaderFrame {
    input: null;
    output: { format: GPUTextureFormat; width: number; height: number; createView: () => GPUTextureView };
    params: ShaderParams;
    state: Record<string, unknown>;
    time: number;
    deltaTime: number;
    frame: number;
    mousePosition: { x: number; y: number } | null;
}

// A Figma shader loaded with `import * as shader from '…/shader.ts?figma-shader'` (see vite.config.ts).
export interface ShaderModule {
    setup: (device: GPUDevice, frame: ShaderFrame) => void;
    render: (device: GPUDevice, frame: ShaderFrame) => void;
    definitions: Record<string, { defaultValue?: unknown }>;
}

export type LiveParams = Record<string, () => unknown>;

export interface ShaderOptions {
    maxPixelRatio?: number;
    // frame rate while idle() is true, to save battery when nothing moves
    idleFps?: number;
    idle?: () => boolean;
    // the GPU was reset or removed (driver update, tab evicted on a phone)
    onDeviceLost?: () => void;
}

// 120 and 144 Hz screens would otherwise render the background twice as often
const MAX_FPS = 60;
const ADAPTER_TIMEOUT_MS = 3000;

export async function canRunFigmaShader(): Promise<boolean> {
    if (!('gpu' in navigator) || !navigator.gpu) {
        return false;
    }
    try {
        // some drivers never answer; treat that as no WebGPU
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ADAPTER_TIMEOUT_MS));
        return (await Promise.race([navigator.gpu.requestAdapter(), timeout])) !== null;
    } catch {
        return false;
    }
}

// Starts the shader on the canvas and returns a function that stops it.
export async function runFigmaShader(
    canvas: HTMLCanvasElement,
    shader: ShaderModule,
    live: LiveParams,
    { maxPixelRatio = 1.25, idleFps = MAX_FPS, idle = () => false, onDeviceLost }: ShaderOptions = {},
): Promise<() => void> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No WebGPU adapter');
    }
    const device = await adapter.requestDevice();
    device.lost.then((info) => {
        if (info.reason !== 'destroyed') {
            onDeviceLost?.();
        }
    });
    // TypeScript's DOM types have no getContext('webgpu') overload yet
    const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
    if (!context) {
        device.destroy();
        throw new Error('No WebGPU canvas context');
    }
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const params: ShaderParams = Object.fromEntries(
        Object.entries(shader.definitions).map(([name, definition]) => [name, definition.defaultValue]),
    );

    const frame: ShaderFrame = {
        input: null,
        output: { format, width: 1, height: 1, createView: () => context.getCurrentTexture().createView() },
        params,
        state: {},
        time: 0,
        deltaTime: 0,
        frame: 0,
        mousePosition: null,
    };

    const handlePointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / Math.max(rect.width, 1);
        frame.mousePosition = { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale };
    };

    const handleResize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        // mobile toolbars fire resize while scrolling; skip when the size did not change
        if (width === canvas.width && height === canvas.height) {
            return;
        }
        canvas.width = width;
        canvas.height = height;
        frame.output.width = width;
        frame.output.height = height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointer, { passive: true });

    try {
        shader.setup(device, frame);
    } catch (error) {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', handlePointer);
        device.destroy();
        throw error;
    }

    let animationFrameId = 0;
    const start = performance.now();
    let last = start;
    const shouldRender = createFrameLimiter();
    const tick = (now: number) => {
        animationFrameId = requestAnimationFrame(tick);
        if (!shouldRender(now, idle() ? idleFps : MAX_FPS)) {
            return;
        }
        frame.deltaTime = now - last;
        frame.time = now - start;
        last = now;
        for (const [name, read] of Object.entries(live)) {
            params[name] = read();
        }
        shader.render(device, frame);
        frame.frame += 1;
    };
    animationFrameId = requestAnimationFrame(tick);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', handlePointer);
        context.unconfigure();
        device.destroy();
    };
}
