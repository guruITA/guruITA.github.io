import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { lowPower, sceneDpr } from './sceneQuality';

// The canvas is fixed to the screen, so the scenes only follow the page when a frame is drawn
function ScrollInvalidate() {
    const invalidate = useThree((state) => state.invalidate);

    useEffect(() => {
        // two frames: drei draws a view that just scrolled into the screen one frame late, and without
        // idle frames (reduced motion) nothing else would draw it
        const redraw = () => invalidate(2);
        window.addEventListener('scroll', redraw, { passive: true });
        window.addEventListener('scrollend', redraw);
        window.addEventListener('resize', redraw);
        return () => {
            window.removeEventListener('scroll', redraw);
            window.removeEventListener('scrollend', redraw);
            window.removeEventListener('resize', redraw);
        };
    }, [invalidate]);

    return null;
}

// One WebGL canvas over the page that draws every section scene (SceneView) inside its own slot.
// Phones keep only a few WebGL contexts alive and drop the oldest; one canvas per scene lost scenes there,
// and each extra canvas also costs a context switch and a composited layer every frame.
function SceneLayer() {
    return (
        <Canvas
            // above the sections, below the navbar (z-index 20), so scenes do not draw over the menu;
            // R3F sets pointer-events inline on its wrapper, so clicks are let through here
            style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}
            frameloop="demand"
            // the canvas covers the whole screen, so its pixel ratio costs more than in a small canvas
            dpr={[1, Math.min(sceneDpr[1], 1.5)]}
            // flat keeps the theme hex colours as they are instead of tone mapping them
            flat
            // multisampling a fullscreen buffer only where the pixel ratio does not smooth the edges already;
            // at 2x it would take ~190 MB of GPU memory
            gl={{ alpha: true, antialias: !lowPower && window.devicePixelRatio < 1.5, powerPreference: 'low-power' }}
            // the canvas does not move with the page; no need to re-measure on every scroll
            resize={{ scroll: false }}
        >
            <ScrollInvalidate />
            <View.Port />
        </Canvas>
    );
}

export default SceneLayer;
