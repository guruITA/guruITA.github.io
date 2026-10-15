import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import cityShaderSource from '../../../../shaders/city-shader.ts?raw';
import { canRunFigmaShader, runFigmaShader } from './figmaShaderHost';

// Three.js only downloads for browsers that need the fallback
const WorldBackground = lazy(() => import('../WorldBackground/WorldBackground'));

import styles from './ShaderBackground.module.scss';

type Mode = 'checking' | 'shader' | 'fallback';

// The 3D city from the Figma design: the same shader file runs in Figma and here.
// Scroll position drives the camera; browsers without WebGPU get the Three.js world instead.
function ShaderBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<Mode>('checking');

    useEffect(() => {
        let cancelled = false;
        canRunFigmaShader().then((supported) => {
            if (!cancelled) {
                setMode(supported ? 'shader' : 'fallback');
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (mode !== 'shader' || !canvas) {
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        runFigmaShader(canvas, cityShaderSource, {
            progress: () => progress,
            speed: () => (reduceMotion ? 0 : 1),
        })
            .then((stopShader) => {
                if (disposed) {
                    stopShader();
                } else {
                    stop = stopShader;
                }
            })
            .catch(() => {
                if (!disposed) {
                    setMode('fallback');
                }
            });

        return () => {
            disposed = true;
            cancelAnimationFrame(easeFrameId);
            window.removeEventListener('scroll', readScroll);
            window.removeEventListener('resize', readScroll);
            stop?.();
        };
    }, [mode]);

    if (mode === 'fallback') {
        return (
            <Suspense fallback={<div className={styles.background} aria-hidden="true" />}>
                <WorldBackground />
            </Suspense>
        );
    }

    return (
        <div className={styles.background} aria-hidden="true">
            {mode === 'shader' && <canvas ref={canvasRef} />}
        </div>
    );
}

export default ShaderBackground;
