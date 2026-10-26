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

export function canUseWebGL(): boolean {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        return gl !== null;
    } catch {
        return false;
    }
}
