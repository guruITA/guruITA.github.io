import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import BackgroundErrorBoundary from '../background/BackgroundErrorBoundary';
import { canUseWebGL } from '../background/deviceProfile';

let webglSupport: boolean | undefined;

function webglSupported() {
    webglSupport ??= canUseWebGL();
    return webglSupport;
}

interface SceneSlotProps {
    className?: string;
    // shown instead when the browser has no WebGL
    fallback?: ReactNode;
    // the lazy scene, told whether it is on screen so it only animates while visible
    children: (inView: boolean) => ReactNode;
}

// Holds the place of a 3D scene in the layout and loads it (with three.js) only once it nears the screen.
// Without WebGL only the fallback renders and the section keeps its plain layout.
function SceneSlot({ className, fallback = null, children }: SceneSlotProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [supported] = useState(webglSupported);
    const [mounted, setMounted] = useState(false);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!supported || !element) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                // during fast scrolling one callback can hold several entries; the last is the current one
                const entry = entries[entries.length - 1];
                setInView(entry.isIntersecting);
                if (entry.isIntersecting) {
                    setMounted(true);
                }
            },
            // start loading a little before the scene scrolls into view
            { rootMargin: '200px 0px' },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [supported]);

    if (!supported) {
        return fallback;
    }

    return (
        <div ref={ref} className={className} aria-hidden="true">
            {mounted && (
                <BackgroundErrorBoundary fallback={null}>
                    <Suspense fallback={null}>{children(inView)}</Suspense>
                </BackgroundErrorBoundary>
            )}
        </div>
    );
}

export default SceneSlot;
