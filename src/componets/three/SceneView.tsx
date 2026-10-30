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

// The shared canvas is not clipped by a carousel row (ui/Carousel) the way the cards in it are, so a scene
// would draw past the edge of the row. A scene that is partly scrolled out of its row hides until it is
// fully back in. A row that runs edge to edge (phones) is clipped by the screen like the canvas, so there
// a scene stays.
function useInsideRow(element: RefObject<HTMLElement | null>) {
    const [inside, setInside] = useState(true);

    useEffect(() => {
        const target = element.current;
        const row = target?.closest<HTMLElement>('[data-carousel-row]');
        if (!target || !row) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[entries.length - 1];
                const bounds = entry.rootBounds;
                const edgeToEdge =
                    bounds !== null && bounds.left <= 0 && bounds.right >= document.documentElement.clientWidth;
                setInside(edgeToEdge || entry.intersectionRatio >= 0.99);
            },
            { root: row, threshold: [0, 0.99] },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [element]);

    return inside;
}

// A section scene drawn by the shared SceneLayer canvas inside this slot, instead of in a canvas of its own.
// Only for scenes that sit on top of their card; the hero orb sits behind the photo and keeps SceneCanvas.
function SceneView({ inView, camera, children }: SceneViewProps) {
    const ref = useRef<HTMLElement>(null);
    const sectionShown = useSectionShown(ref);
    const insideRow = useInsideRow(ref);
    const shown = sectionShown && insideRow;

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
