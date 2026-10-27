import { useSyncExternalStore } from 'react';

// Whether a section scene asked for the shared scene canvas (SceneLayer). Kept free of three.js,
// so the page can watch it without downloading three.js before a scene nears the screen.
let needed = false;
const listeners = new Set<() => void>();

export function requestSceneLayer() {
    if (needed) {
        return;
    }
    needed = true;
    listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function useSceneLayerNeeded() {
    return useSyncExternalStore(subscribe, () => needed);
}
