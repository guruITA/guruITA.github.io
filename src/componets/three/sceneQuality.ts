import { MathUtils } from 'three';
import { isLowPowerDevice } from '../background/deviceProfile';

// Decided once when the first scene loads: phones and weaker laptops get the lighter version
export const lowPower = isLowPowerDevice();
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const sceneFps = lowPower ? 30 : 60;
export const sceneDpr: [number, number] = lowPower ? [1, 1.5] : [1, 2];

// Idle motion (spinning, bobbing) multiplier: still scenes for people who ask for less motion
export const idleMotion = reducedMotion ? 0 : 1;

// Eases a value towards its target; jumps straight there when motion is reduced
export function approach(current: number, target: number, lambda: number, delta: number) {
    if (reducedMotion) {
        return target;
    }
    // a long pause between frames (scene out of view) should not make the value overshoot
    return MathUtils.damp(current, target, lambda, Math.min(delta, 0.1));
}

export function themeColor(name: string, fallback: string) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}
