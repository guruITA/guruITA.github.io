import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const BASE = -0.7;
// heights of the bars; the last one is the prediction
const BARS = [0.45, 0.7, 0.55, 1.05];
const BAR_STEP = 0.36;
const BARS_X = 0.15;
const HOLES = 5;

// Movie Success Prediction: a film reel next to a bar chart whose last bar, the prediction, glows
function FilmChart({ active }: PreviewProps) {
    const sway = useRef<Group>(null);
    const reel = useRef<Group>(null);
    const bars = useRef<(Mesh | null)[]>([]);
    const star = useRef<Mesh>(null);
    const prediction = useRef<MeshStandardMaterial>(null);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const colors = useMemo(() => {
        const blue = themeColor('--color-blue', '#539bef');
        const cyan = themeColor('--color-cyan', '#22d3ee');
        return {
            bars: [blue, blue, cyan],
            mint: themeColor('--color-mint', '#2dd4bf'),
            reel: '#2f5596',
            hole: '#07122a',
        };
    }, []);

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.7 + lift * 1.2) * idleMotion;
        const t = time.current;
        if (sway.current) {
            sway.current.rotation.y = Math.sin(t * 0.5) * 0.35;
        }
        if (reel.current) {
            reel.current.rotation.z = -t * 1.2;
        }
        // the bars breathe a little; hovering pushes them all up
        let top = BASE;
        bars.current.forEach((bar, i) => {
            if (!bar) {
                return;
            }
            const height = BARS[i] * (0.9 + 0.1 * Math.sin(t * 1.6 + i * 1.3)) * (1 + lift * 0.3);
            bar.scale.y = height;
            bar.position.y = BASE + height / 2;
            top = BASE + height;
        });
        if (star.current) {
            star.current.position.y = top + 0.22;
            star.current.rotation.y = t * 2;
        }
        if (prediction.current) {
            prediction.current.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2)) + lift * 0.6;
        }
    });

    return (
        <group rotation={[0.15, 0, 0]}>
            <group ref={sway}>
                <group position={[-1.05, -0.05, 0]}>
                    <group ref={reel}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.62, 0.62, 0.12, lowPower ? 24 : 48]} />
                            <meshStandardMaterial color={colors.reel} metalness={0.55} roughness={0.35} />
                        </mesh>
                        {Array.from({ length: HOLES }, (_, i) => {
                            const angle = (i / HOLES) * Math.PI * 2;
                            return (
                                <mesh
                                    key={i}
                                    position={[Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0]}
                                    rotation={[Math.PI / 2, 0, 0]}
                                >
                                    <cylinderGeometry args={[0.13, 0.13, 0.13, lowPower ? 12 : 24]} />
                                    <meshStandardMaterial color={colors.hole} />
                                </mesh>
                            );
                        })}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
                            <meshStandardMaterial color={colors.mint} emissive={colors.mint} emissiveIntensity={0.6} />
                        </mesh>
                    </group>
                </group>

                <mesh position={[BARS_X + BAR_STEP * 1.5, BASE - 0.02, 0]}>
                    <boxGeometry args={[BAR_STEP * 4 + 0.2, 0.04, 0.34]} />
                    <meshStandardMaterial color={colors.reel} />
                </mesh>
                {BARS.map((height, i) => {
                    const last = i === BARS.length - 1;
                    return (
                        <mesh
                            key={i}
                            ref={(bar) => {
                                bars.current[i] = bar;
                            }}
                            position={[BARS_X + i * BAR_STEP, BASE + height / 2, 0]}
                            scale={[1, height, 1]}
                        >
                            <boxGeometry args={[0.22, 1, 0.22]} />
                            {last ? (
                                <meshStandardMaterial
                                    ref={prediction}
                                    color={colors.mint}
                                    emissive={colors.mint}
                                    emissiveIntensity={0.6}
                                />
                            ) : (
                                <meshStandardMaterial
                                    color={colors.bars[i]}
                                    emissive={colors.bars[i]}
                                    emissiveIntensity={0.15}
                                    flatShading
                                />
                            )}
                        </mesh>
                    );
                })}
                <mesh ref={star} position={[BARS_X + (BARS.length - 1) * BAR_STEP, BASE + BARS[3] + 0.22, 0]}>
                    <octahedronGeometry args={[0.1]} />
                    <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.2} />
                </mesh>
            </group>
        </group>
    );
}

export default FilmChart;
