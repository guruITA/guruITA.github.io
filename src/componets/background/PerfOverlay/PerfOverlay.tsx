import { useEffect, useState } from 'react';
import { perfStats } from '../perfStats';
import styles from './PerfOverlay.module.scss';

interface Snapshot {
    fps: number;
    worstMs: number;
    canvases: number;
    lost: number;
}

function gpuName() {
    try {
        const gl = document.createElement('canvas').getContext('webgl2');
        const info = gl?.getExtension('WEBGL_debug_renderer_info');
        const name = info ? String(gl?.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown';
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        return name;
    } catch {
        return 'no WebGL';
    }
}

// Debug readout for testing on phones and laptops: open the site with ?perf=1
function PerfOverlay() {
    const [gpu] = useState(gpuName);
    const [snapshot, setSnapshot] = useState<Snapshot>({ fps: 0, worstMs: 0, canvases: 0, lost: 0 });

    useEffect(() => {
        let lost = 0;
        const onLost = () => {
            lost += 1;
        };
        document.addEventListener('webglcontextlost', onLost, true);

        let frames = 0;
        let worst = 0;
        let last = performance.now();
        let windowStart = last;
        let frame = requestAnimationFrame(function tick(now) {
            frames += 1;
            worst = Math.max(worst, now - last);
            last = now;
            if (now - windowStart >= 1000) {
                setSnapshot({
                    fps: Math.round((frames * 1000) / (now - windowStart)),
                    worstMs: Math.round(worst),
                    canvases: document.querySelectorAll('canvas').length,
                    lost,
                });
                frames = 0;
                worst = 0;
                windowStart = now;
            }
            frame = requestAnimationFrame(tick);
        });

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('webglcontextlost', onLost, true);
        };
    }, []);

    return (
        <div className={styles.overlay} aria-hidden="true">
            <div>
                {snapshot.fps} fps · worst {snapshot.worstMs} ms
            </div>
            <div>
                background {perfStats.backgroundMode}
                {perfStats.backgroundRatio > 0 && ` @ ${perfStats.backgroundRatio.toFixed(2)}x`}
            </div>
            <div>
                canvases {snapshot.canvases} · lost {snapshot.lost}
            </div>
            <div>
                dpr {window.devicePixelRatio.toFixed(2)} · {window.innerWidth}×{window.innerHeight}
            </div>
            <div className={styles.gpu}>{gpu}</div>
        </div>
    );
}

export default PerfOverlay;
