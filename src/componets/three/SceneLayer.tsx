import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { FrameDriver } from './SceneCanvas';
import { lowPower, sceneDpr } from './sceneQuality';
import { useAnySceneAnimating } from './sceneLayerStore';

// The canvas is fixed to the screen, so the scenes only follow the page when a frame is drawn
function ScrollInvalidate() {
    const invalidate = useThree((state) => state.invalidate);

    useEffect(() => {
        // one frame per scroll event (they come about once a frame; more would queue up frames), and two
        // once scrolling stops: drei draws a view that just came into the screen one frame late, and without
        // idle frames (reduced motion) nothing else would draw it. A timer, as Safari has no scrollend.
        // Capture also catches the scroll of elements (the carousels), which does not bubble to window.
        let settle = 0;
        const redraw = () => {
            invalidate();
            clearTimeout(settle);
            settle = window.setTimeout(() => invalidate(2), 120);
        };
        window.addEventListener('scroll', redraw, { capture: true, passive: true });
        window.addEventListener('resize', redraw);
        return () => {
            clearTimeout(settle);
            window.removeEventListener('scroll', redraw, { capture: true });
            window.removeEventListener('resize', redraw);
        };
    }, [invalidate]);

    return null;
}

// One WebGL canvas over the page that draws every section scene (SceneView) inside its own slot.
// Phones keep only a few WebGL contexts alive and drop the oldest; one canvas per scene lost scenes there,
// and each extra canvas also costs a context switch and a composited layer every frame.
function SceneLayer() {
    const animating = useAnySceneAnimating();

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
            <FrameDriver running={animating} />
            <View.Port />
        </Canvas>
    );
}

export default SceneLayer;
