import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import cityShaderSource from '../../../../shaders/city-shader.ts?raw';
import BackgroundErrorBoundary from '../BackgroundErrorBoundary';
import { canUseWebGL, isLowPowerDevice } from '../deviceProfile';
import { canRunFigmaShader, runFigmaShader } from './figmaShaderHost';

// Three.js only downloads for browsers that need the fallback
const WorldBackground = lazy(() => import('../WorldBackground/WorldBackground'));

import styles from './ShaderBackground.module.scss';

// static: no WebGPU and no WebGL, only the plain background colour
type Mode = 'checking' | 'shader' | 'fallback' | 'static';

const fallbackMode = (): Mode => (canUseWebGL() ? 'fallback' : 'static');

// The 3D city from the Figma design: the same shader file runs in Figma and here.
// Scroll position drives the camera; browsers without WebGPU get the Three.js world instead.
function ShaderBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<Mode>('checking');

    useEffect(() => {
        let cancelled = false;
        canRunFigmaShader().then((supported) => {
            if (!cancelled) {
                setMode(supported ? 'shader' : fallbackMode());
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // without WebGPU or WebGL the page is usually drawn in software, so index.scss pauses the looping animations
    useEffect(() => {
        if (mode !== 'static') {
            return;
        }
        document.documentElement.dataset.background = 'static';
        return () => {
            delete document.documentElement.dataset.background;
        };
    }, [mode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (mode !== 'shader' || !canvas) {
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const lowPower = isLowPowerDevice();
        let target = 0;
        let progress = 0;
        let easeFrameId = 0;

        const readScroll = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            target = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
        };
        // eases toward the scroll position like the Motion keyframes between the Figma screens
        const ease = () => {
            progress += (target - progress) * (reduceMotion ? 1 : 0.08);
            easeFrameId = requestAnimationFrame(ease);
        };

        readScroll();
        progress = target;
        window.addEventListener('scroll', readScroll, { passive: true });
        window.addEventListener('resize', readScroll);
        easeFrameId = requestAnimationFrame(ease);

        let stop: (() => void) | null = null;
        let disposed = false;
        const switchToFallback = () => {
            if (!disposed) {
                setMode(fallbackMode());
            }
        };
        runFigmaShader(
            canvas,
            cityShaderSource,
            {
                progress: () => progress,
                speed: () => (reduceMotion ? 0 : 1),
            },
            {
                maxPixelRatio: lowPower ? 1 : 1.25,
                // weaker devices drop to 30 fps once the camera has stopped moving
                idleFps: lowPower ? 30 : 60,
                idle: () => Math.abs(target - progress) < 0.0005,
                onDeviceLost: switchToFallback,
            },
        )
            .then((stopShader) => {
                if (disposed) {
                    stopShader();
                } else {
                    stop = stopShader;
                }
            })
            .catch(switchToFallback);

        return () => {
            disposed = true;
            cancelAnimationFrame(easeFrameId);
            window.removeEventListener('scroll', readScroll);
            window.removeEventListener('resize', readScroll);
            stop?.();
        };
    }, [mode]);

    const plainBackground = <div className={styles.background} aria-hidden="true" />;

    if (mode === 'static') {
        return plainBackground;
    }

    if (mode === 'fallback') {
        return (
            <BackgroundErrorBoundary fallback={plainBackground}>
                <Suspense fallback={plainBackground}>
                    <WorldBackground />
                </Suspense>
            </BackgroundErrorBoundary>
        );
    }

    return (
        <div className={styles.background} aria-hidden="true">
            {mode === 'shader' && <canvas ref={canvasRef} />}
        </div>
    );
}

export default ShaderBackground;
