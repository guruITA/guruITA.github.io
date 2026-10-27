import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, View } from '@react-three/drei';
import BackgroundErrorBoundary from '../background/BackgroundErrorBoundary';
import { reducedMotion } from './sceneQuality';
import { requestSceneLayer, startSceneAnimation } from './sceneLayerStore';

interface SceneViewProps {
    inView: boolean;
    camera: { position: [number, number, number]; fov: number };
    children: ReactNode;
}

// Draws one frame when the scene appears; without idle frames (reduced motion) nothing else would
function DrawOnChange({ value }: { value: boolean }) {
    const invalidate = useThree((state) => state.invalidate);
    useEffect(() => invalidate(2), [value, invalidate]);
    return null;
}

// Sections fade in once they scroll into view (Home.module.scss). The shared canvas lies above them and
// cannot fade with them, so the scene shows up once its section is halfway faded in.
function useSectionShown(element: RefObject<HTMLElement | null>) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const section = element.current?.closest('section');
        let frame = requestAnimationFrame(function check() {
            if (!section || Number(getComputedStyle(section).opacity) >= 0.5) {
                setShown(true);
                return;
            }
            frame = requestAnimationFrame(check);
        });
        return () => cancelAnimationFrame(frame);
    }, [element]);

    return shown;
}

// A section scene drawn by the shared SceneLayer canvas inside this slot, instead of in a canvas of its own.
// Only for scenes that sit on top of their card; the hero orb sits behind the photo and keeps SceneCanvas.
function SceneView({ inView, camera, children }: SceneViewProps) {
    const ref = useRef<HTMLElement>(null);
    const shown = useSectionShown(ref);

    useEffect(() => requestSceneLayer(), []);

    // the shared canvas runs one frame driver for all scenes (SceneLayer); one per scene would each
    // keep their own schedule and together draw the canvas more often than sceneFps
    const animating = inView && shown && !reducedMotion;
    useEffect(() => (animating ? startSceneAnimation() : undefined), [animating]);

    return (
        <View ref={ref} visible={shown} style={{ width: '100%', height: '100%' }}>
            <PerspectiveCamera makeDefault position={camera.position} fov={camera.fov} />
            <DrawOnChange value={shown} />
            {/* all scenes share one canvas; one that fails should not take the others down */}
            <BackgroundErrorBoundary fallback={null}>
                {children}
            </BackgroundErrorBoundary>
        </View>
    );
}

export default SceneView;
