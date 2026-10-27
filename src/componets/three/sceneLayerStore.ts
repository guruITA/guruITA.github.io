import { useSyncExternalStore } from 'react';

// Shared state of the section scenes and their one canvas (SceneLayer). Kept free of three.js,
// so the page can watch it without downloading three.js before a scene nears the screen.
let needed = false;
// scenes on screen that animate; the shared canvas draws frames while there is at least one
let running = 0;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function requestSceneLayer() {
    if (needed) {
        return;
    }
    needed = true;
    notify();
}

export function useSceneLayerNeeded() {
    return useSyncExternalStore(subscribe, () => needed);
}

// Marks a scene as animating until the returned function is called
export function startSceneAnimation() {
    running += 1;
    notify();
    return () => {
        running -= 1;
        notify();
    };
}

export function useAnySceneAnimating() {
    return useSyncExternalStore(subscribe, () => running > 0);
}
