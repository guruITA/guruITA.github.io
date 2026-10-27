import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import * as cityShader from '../../../../shaders/city-shader.ts?figma-shader';
import BackgroundErrorBoundary from '../BackgroundErrorBoundary';
import { canUseWebGL, cityBudget, isLowPowerDevice } from '../deviceProfile';
import { perfStats } from '../perfStats';
import { runCityWebgl } from './cityWebgl';
import { canRunFigmaShader, runFigmaShader, type ShaderOptions } from './figmaShaderHost';

// Three.js only downloads for browsers that need the fallback
const WorldBackground = lazy(() => import('../WorldBackground/WorldBackground'));

import styles from './ShaderBackground.module.scss';

// shader: the city with WebGPU; webgl: the same city with WebGL2 (browsers without WebGPU);
// fallback: the lighter three.js world; static: no usable GPU, only the plain background colour
type Mode = 'checking' | 'shader' | 'webgl' | 'fallback' | 'static';

function fallbackMode(): Mode {
    if (canUseWebGL()) {
        return 'fallback';
    }
    perfStats.backgroundReason = `${perfStats.backgroundReason}, and no usable WebGL`;
    return 'static';
}

// The city drawn with WebGL when WebGPU is missing or failed (Chrome has no WebGPU on many Android GPUs)
const cityModeWithoutWebgpu = (): Mode => (canUseWebGL() ? 'webgl' : fallbackMode());

// The 3D city from the Figma design: the same shader file runs in Figma and here.
// Scroll position drives the camera; browsers without WebGPU draw the same city with WebGL.
function ShaderBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<Mode>('checking');

    useEffect(() => {
        let cancelled = false;
        canRunFigmaShader().then((supported) => {
            if (!cancelled) {
                setMode(supported ? 'shader' : cityModeWithoutWebgpu());
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // without WebGPU or WebGL the page is usually drawn in software, so index.scss pauses the looping animations
    useEffect(() => {
        perfStats.backgroundMode = mode;
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
        if ((mode !== 'shader' && mode !== 'webgl') || !canvas) {
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
        // the reason shows in the ?perf overlay, to tell why a device left the WebGPU city
        const switchTo = (next: Mode, reason: string) => {
            if (!disposed) {
                perfStats.backgroundReason = reason;
                setMode(next);
            }
        };
        const live = {
            progress: () => progress,
            speed: () => (reduceMotion ? 0 : 1),
        };
        const options: ShaderOptions = {
            maxPixelRatio: lowPower ? 1 : 1.25,
            // Safari and Firefox may leave the vendor empty; a Mac then counts as Apple (older Intel Macs
            // are caught by the frame rate check)
            budget: (vendor) => cityBudget(vendor || (/Macintosh/.test(navigator.userAgent) ? 'apple' : ''), lowPower),
            // the city moves little once the camera has stopped; 30 fps halves the GPU load while reading
            idleFps: 30,
            idle: () => Math.abs(target - progress) < 0.0005,
            // the GPU cannot even draw the city at the lowest resolution: the three.js world is lighter,
            // and it falls back to the static background in turn when that is too slow as well
            onTooSlow: () => switchTo(fallbackMode(), 'city too slow on this GPU'),
        };

        if (mode === 'webgl') {
            // a microtask, so a failed start does not set state while this effect still runs
            queueMicrotask(() => {
                if (disposed) {
                    return;
                }
                try {
                    stop = runCityWebgl(canvas, cityShader, live, {
                        ...options,
                        onDeviceLost: () => switchTo(fallbackMode(), 'WebGL context lost'),
                    });
                } catch (error) {
                    switchTo(fallbackMode(), `WebGL city failed to start: ${String(error)}`);
                }
            });
        } else {
            runFigmaShader(canvas, cityShader, live, {
                ...options,
                onDeviceLost: () => switchTo(cityModeWithoutWebgpu(), 'WebGPU device lost'),
            })
                .then((stopShader) => {
                    if (disposed) {
                        stopShader();
                    } else {
                        stop = stopShader;
                    }
                })
                .catch((error: unknown) =>
                    switchTo(cityModeWithoutWebgpu(), `WebGPU city failed to start: ${String(error)}`),
                );
        }

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
                    <WorldBackground
                        onTooSlow={() => {
                            perfStats.backgroundReason = 'three.js world too slow on this GPU';
                            setMode('static');
                        }}
                    />
                </Suspense>
            </BackgroundErrorBoundary>
        );
    }

    return (
        <div className={styles.background} aria-hidden="true">
            {/* a canvas that had a WebGPU context cannot get a WebGL one, so each city gets its own */}
            {(mode === 'shader' || mode === 'webgl') && <canvas key={mode} ref={canvasRef} />}
        </div>
    );
}

export default ShaderBackground;
