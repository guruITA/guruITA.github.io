// What the device can handle, so the background scales down on phones and weaker laptops.

interface NavigatorHints {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
}

// Phones, devices with few cores or little memory, and data saver mode get the lighter scene
export function isLowPowerDevice(): boolean {
    const hints = navigator as Navigator & NavigatorHints;
    const smallTouchScreen =
        window.matchMedia('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 768;
    const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
    const littleMemory = (hints.deviceMemory ?? 8) <= 4;
    const saveData = hints.connection?.saveData === true;
    return smallTouchScreen || fewCores || littleMemory || saveData;
}

// The GPU name WebGL reports, e.g. "ANGLE (Intel, Intel(R) UHD Graphics 630 ...)"; null without WebGL
let rendererName: string | null | undefined;

function webglRendererName(): string | null {
    if (rendererName !== undefined) {
        return rendererName;
    }
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        if (!gl) {
            rendererName = null;
            return rendererName;
        }
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        rendererName = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
        rendererName = null;
    }
    return rendererName;
}

// Browsers without a usable GPU (blocked driver, virtual machine, remote desktop) draw WebGL on the CPU;
// 3D is then so slow that the page is better off without it
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function canUseWebGL(): boolean {
    const name = webglRendererName();
    return name !== null && !SOFTWARE_RENDERER.test(name);
}

// GPU maker from the WebGL renderer name, in the words WebGPU's adapter.info.vendor uses
export function webglGpuVendor(): string {
    const name = webglRendererName() ?? '';
    const vendor = /nvidia|geforce|quadro|rtx/i.test(name)
        ? 'nvidia'
        : /amd|radeon/i.test(name)
          ? 'amd'
          : /apple/i.test(name)
            ? 'apple'
            : /intel/i.test(name)
              ? 'intel'
              : '';
    // Safari may only report "Apple GPU" or nothing useful; a Mac then counts as Apple
    return vendor || (/Macintosh/.test(navigator.userAgent) ? 'apple' : '');
}

export interface GpuBudget {
    // pixels per second of the city shader the GPU keeps up without slowing down
    pixelsPerSecond: number;
    // whether the resolution may go above the budget after a long run of fast frames (see adaptiveResolution)
    raiseAboveBudget: boolean;
}

// An Intel UHD 630 kept about 11 million city pixels per second and then stayed smooth; heavier loads
// made it drop to 10 fps after 7-14 seconds, because integrated GPUs share their power with the CPU.
// Phones and integrated GPUs (also unknown ones) start under that and stay there. Dedicated NVIDIA GPUs
// and Apple's GPUs in Macs keep their speed, so the budget is only their starting point. AMD is often
// integrated in laptops, but its integrated GPUs are several times faster than that Intel one.
export function cityBudget(vendor: string, lowPower: boolean): GpuBudget {
    if (lowPower) {
        return { pixelsPerSecond: 8_000_000, raiseAboveBudget: false };
    }
    switch (vendor) {
        case 'nvidia':
            return { pixelsPerSecond: 60_000_000, raiseAboveBudget: true };
        case 'apple':
            return { pixelsPerSecond: 40_000_000, raiseAboveBudget: true };
        case 'amd':
            return { pixelsPerSecond: 20_000_000, raiseAboveBudget: false };
        default:
            return { pixelsPerSecond: 10_000_000, raiseAboveBudget: false };
    }
}
