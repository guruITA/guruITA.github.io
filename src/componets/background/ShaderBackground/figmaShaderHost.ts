// Runs a Figma shader (its unchanged main.ts from the Figma library) on a canvas.
// The shader receives the same frame object Figma gives it: output, params, state, time and mouse.

import type { GpuBudget } from '../deviceProfile';
import { perfStats } from '../perfStats';
import { MAX_FPS, startShaderLoop } from './shaderLoop';

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
    // the render resolution moves between these pixel ratios, depending on how fast the GPU is
    maxPixelRatio?: number;
    minPixelRatio?: number;
    // what this GPU keeps up with the shader, given its vendor ('' when unknown; see adaptiveResolution)
    budget?: (vendor: string) => GpuBudget;
    // even the lowest resolution is far too slow for this device
    onTooSlow?: () => void;
    // frame rate while idle() is true, to save battery when nothing moves
    idleFps?: number;
    idle?: () => boolean;
    // the GPU was reset or removed (driver update, tab evicted on a phone)
    onDeviceLost?: () => void;
}

const ADAPTER_TIMEOUT_MS = 3000;

// Chrome 113-126 (and browsers built on it, such as Samsung Internet) have WebGPU but no adapter.info
function adapterInfo(adapter: GPUAdapter | null): Partial<GPUAdapterInfo> & { isFallbackAdapter?: boolean } {
    return (adapter as (GPUAdapter & { info?: GPUAdapterInfo }) | null)?.info ?? {};
}

export async function canRunFigmaShader(): Promise<boolean> {
    if (!('gpu' in navigator) || !navigator.gpu) {
        perfStats.backgroundReason = 'no WebGPU in this browser';
        return false;
    }
    try {
        // some drivers never answer; treat that as no WebGPU
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ADAPTER_TIMEOUT_MS));
        const adapter = await Promise.race([navigator.gpu.requestAdapter(), timeout]);
        if (adapter === null) {
            perfStats.backgroundReason = 'no WebGPU adapter';
            return false;
        }
        // a fallback adapter runs on the CPU (no usable GPU); the city would crawl there. Newer browsers
        // report it in adapter.info, older ones (without adapter.info) on the adapter itself
        const onAdapter = (adapter as GPUAdapter & { isFallbackAdapter?: boolean }).isFallbackAdapter;
        if (onAdapter === true || adapterInfo(adapter).isFallbackAdapter === true) {
            perfStats.backgroundReason = 'WebGPU runs on the CPU';
            return false;
        }
        return true;
    } catch (error) {
        perfStats.backgroundReason = `WebGPU check failed: ${String(error)}`;
        return false;
    }
}

// Starts the shader on the canvas and returns a function that stops it.
export async function runFigmaShader(
    canvas: HTMLCanvasElement,
    shader: ShaderModule,
    live: LiveParams,
    {
        maxPixelRatio = 1.25,
        minPixelRatio = 0.35,
        budget = () => ({ pixelsPerSecond: 10_000_000, raiseAboveBudget: false }),
        idleFps = MAX_FPS,
        idle = () => false,
        onDeviceLost,
        onTooSlow,
    }: ShaderOptions = {},
): Promise<() => void> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No WebGPU adapter');
    }
    // decided before the device exists, so a failure here leaves no device behind
    const gpuBudget = budget(adapterInfo(adapter).vendor ?? '');
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

    try {
        shader.setup(device, frame);
    } catch (error) {
        device.destroy();
        throw error;
    }

    const stopLoop = startShaderLoop(
        canvas,
        ({ width, height, time, deltaTime, mouse }) => {
            frame.output.width = width;
            frame.output.height = height;
            frame.time = time;
            frame.deltaTime = deltaTime;
            frame.mousePosition = mouse;
            for (const [name, read] of Object.entries(live)) {
                params[name] = read();
            }
            shader.render(device, frame);
            frame.frame += 1;
        },
        { maxPixelRatio, minPixelRatio, budget: gpuBudget, idleFps, idle, onTooSlow },
    );

    return () => {
        stopLoop();
        context.unconfigure();
        device.destroy();
    };
}
