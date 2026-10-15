// Runs a Figma shader (its unchanged main.ts from the Figma library) on a canvas.
// The shader receives the same frame object Figma gives it: output, params, state, time and mouse.

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

interface ShaderModule {
    setup: (device: GPUDevice, frame: ShaderFrame) => void;
    render: (device: GPUDevice, frame: ShaderFrame) => void;
    definitions: Record<string, { defaultValue?: unknown }>;
}

export type LiveParams = Record<string, () => unknown>;

function compileShaderModule(source: string): ShaderModule {
    let definitions: ShaderModule['definitions'] = {};
    const body = source
        .replace(/^\s*import\s*\{\s*defineProperties\s*\}\s*from\s*["']figma:shaders["'];?\s*$/m, '')
        .replace(/export\s+default\s+function\s+Effect/, 'function Effect')
        .replace(/export\s+function\s+setup/, 'function setup')
        .replace(/export\s+function\s+render/, 'function render');
    const defineProperties = (_effect: unknown, props: ShaderModule['definitions']) => {
        definitions = props;
    };
    const exports = new Function('defineProperties', `${body}\nreturn { setup, render };`)(
        defineProperties,
    ) as Pick<ShaderModule, 'setup' | 'render'>;
    return { ...exports, definitions };
}

export async function canRunFigmaShader(): Promise<boolean> {
    if (!('gpu' in navigator) || !navigator.gpu) {
        return false;
    }
    try {
        return (await navigator.gpu.requestAdapter()) !== null;
    } catch {
        return false;
    }
}

// Starts the shader on the canvas and returns a function that stops it.
export async function runFigmaShader(
    canvas: HTMLCanvasElement,
    source: string,
    live: LiveParams,
    maxPixelRatio = 1.25,
): Promise<() => void> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No WebGPU adapter');
    }
    const device = await adapter.requestDevice();
    // TypeScript's DOM types have no getContext('webgpu') overload yet
    const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
    if (!context) {
        throw new Error('No WebGPU canvas context');
    }
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const shader = compileShaderModule(source);
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
        canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        frame.output.width = canvas.width;
        frame.output.height = canvas.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointer, { passive: true });

    shader.setup(device, frame);

    let animationFrameId = 0;
    const start = performance.now();
    let last = start;
    const tick = (now: number) => {
        frame.deltaTime = now - last;
        frame.time = now - start;
        last = now;
        for (const [name, read] of Object.entries(live)) {
            params[name] = read();
        }
        shader.render(device, frame);
        frame.frame += 1;
        animationFrameId = requestAnimationFrame(tick);
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
