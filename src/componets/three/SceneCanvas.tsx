import { useEffect, type ReactNode } from 'react';
import { Canvas, useThree, type CanvasProps } from '@react-three/fiber';
import { createFrameLimiter } from '../background/frameLimiter';
import { lowPower, reducedMotion, sceneDpr, sceneFps } from './sceneQuality';

// Requests frames at the device's frame rate while the scene is in view, and none otherwise
export function FrameDriver({ running }: { running: boolean }) {
    const invalidate = useThree((state) => state.invalidate);

    useEffect(() => {
        if (!running) {
            return;
        }
        const limiter = createFrameLimiter();
        let frame = requestAnimationFrame(function tick(now) {
            if (limiter(now, sceneFps)) {
                invalidate();
            }
            frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [running, invalidate]);

    return null;
}

type SceneCanvasProps = Omit<CanvasProps, 'frameloop' | 'dpr' | 'gl' | 'flat' | 'resize' | 'children' | 'style'> & {
    inView: boolean;
    children: ReactNode;
};

// One small R3F canvas inside a section; renders on demand, so an idle or hidden scene costs nothing
function SceneCanvas({ inView, children, ...props }: SceneCanvasProps) {
    return (
        <Canvas
            {...props}
            // the scenes are decoration and react to their card, so clicks go through to the page;
            // R3F sets pointer-events inline on its wrapper, which would override the slot's CSS
            style={{ pointerEvents: 'none' }}
            frameloop="demand"
            dpr={sceneDpr}
            // flat keeps the theme hex colours as they are instead of tone mapping them
            flat
            // weaker devices skip multisampling; the higher pixel ratio already smooths the edges
            gl={{ alpha: true, antialias: !lowPower, powerPreference: 'low-power' }}
            // the canvas moves with the page; no need to re-measure on every scroll
            resize={{ scroll: false }}
        >
            <FrameDriver running={inView && !reducedMotion} />
            {children}
        </Canvas>
    );
}

export default SceneCanvas;
