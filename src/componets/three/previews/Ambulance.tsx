import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial, type Group, type Mesh } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const RED = '#ef4444';
const CHECKS = 3;

// Rode Kruis app: a Red Cross van with a flashing beacon, and its check form being ticked off
function Ambulance({ active }: PreviewProps) {
    const turn = useRef<Group>(null);
    const van = useRef<Group>(null);
    const beacon = useRef<MeshStandardMaterial>(null);
    const boxes = useRef<(Mesh | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const { checked, unchecked, colors } = useMemo(() => {
        const mint = themeColor('--color-mint', '#2dd4bf');
        return {
            checked: new MeshStandardMaterial({ color: mint, emissive: mint, emissiveIntensity: 0.9 }),
            unchecked: new MeshStandardMaterial({ color: '#94a3b8' }),
            colors: {
                body: '#e5edf7',
                glass: '#1e3a6e',
                tyre: '#111827',
                board: '#cbd5e1',
                navy: '#0d1e39',
                blue: themeColor('--color-blue', '#539bef'),
                cyan: themeColor('--color-cyan', '#22d3ee'),
            },
        };
    }, []);

    useEffect(
        () => () => {
            checked.dispose();
            unchecked.dispose();
        },
        [checked, unchecked],
    );

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.8 + lift * 1.4) * idleMotion;
        const t = time.current;
        if (turn.current) {
            turn.current.rotation.y = -0.45 + Math.sin(t * 0.45) * 0.3;
        }
        if (van.current) {
            van.current.position.y = Math.abs(Math.sin(t * 6)) * 0.015;
        }
        if (beacon.current) {
            beacon.current.emissiveIntensity = (t * 3) % 1 < 0.5 ? 1.8 : 0.25;
        }
        // the form is ticked off row by row and starts over; still scenes show it filled in
        const done = idleMotion > 0 ? Math.floor(t * 1.2) % (CHECKS + 2) : CHECKS;
        boxes.current.forEach((box, i) => {
            if (box) {
                box.material = lift > 0.5 || i < done ? checked : unchecked;
            }
        });
    });

    const smoothness = lowPower ? 2 : 4;

    return (
        <group rotation={[0.3, 0, 0]} position={[0, -0.05, 0]}>
            <group ref={turn}>
                <group ref={van} position={[0.3, 0, 0]}>
                    <RoundedBox args={[1.35, 0.72, 0.74]} radius={0.06} smoothness={smoothness} position={[-0.2, 0.05, 0]}>
                        <meshStandardMaterial color={colors.body} roughness={0.4} />
                    </RoundedBox>
                    <RoundedBox args={[0.55, 0.56, 0.72]} radius={0.06} smoothness={smoothness} position={[0.72, -0.03, 0]}>
                        <meshStandardMaterial color={colors.body} roughness={0.4} />
                    </RoundedBox>
                    {/* red band around the body, and windows on the cab */}
                    <mesh position={[-0.2, -0.2, 0]}>
                        <boxGeometry args={[1.36, 0.06, 0.745]} />
                        <meshStandardMaterial color={RED} />
                    </mesh>
                    <mesh position={[1.0, 0.08, 0]}>
                        <boxGeometry args={[0.02, 0.22, 0.6]} />
                        <meshStandardMaterial color={colors.glass} emissive={colors.cyan} emissiveIntensity={0.15} />
                    </mesh>
                    {[-1, 1].map((side) => (
                        <group key={side}>
                            <mesh position={[0.78, 0.08, side * 0.362]}>
                                <boxGeometry args={[0.26, 0.2, 0.01]} />
                                <meshStandardMaterial color={colors.glass} emissive={colors.cyan} emissiveIntensity={0.15} />
                            </mesh>
                            {/* the red cross on both sides */}
                            <group position={[-0.2, 0.12, side * 0.373]}>
                                <mesh>
                                    <boxGeometry args={[0.34, 0.1, 0.01]} />
                                    <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.25} />
                                </mesh>
                                <mesh>
                                    <boxGeometry args={[0.1, 0.34, 0.01]} />
                                    <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.25} />
                                </mesh>
                            </group>
                            {[-0.55, 0.65].map((x) => (
                                <mesh key={x} position={[x, -0.33, side * 0.37]} rotation={[Math.PI / 2, 0, 0]}>
                                    <cylinderGeometry args={[0.16, 0.16, 0.1, lowPower ? 16 : 28]} />
                                    <meshStandardMaterial color={colors.tyre} roughness={0.8} />
                                </mesh>
                            ))}
                        </group>
                    ))}
                    <mesh position={[0.72, 0.29, 0]}>
                        <boxGeometry args={[0.18, 0.08, 0.16]} />
                        <meshStandardMaterial ref={beacon} color={colors.blue} emissive="#3b82f6" emissiveIntensity={1.8} />
                    </mesh>
                </group>

                <group position={[-1.5, 0.15, 0]} rotation={[0, 0.35, 0]}>
                    <RoundedBox args={[0.55, 0.72, 0.05]} radius={0.03} smoothness={smoothness}>
                        <meshStandardMaterial color={colors.board} roughness={0.6} />
                    </RoundedBox>
                    <mesh position={[0, 0.36, 0.02]}>
                        <boxGeometry args={[0.22, 0.07, 0.07]} />
                        <meshStandardMaterial color={colors.navy} />
                    </mesh>
                    {Array.from({ length: CHECKS }, (_, i) => (
                        <group key={i} position={[0, 0.15 - i * 0.2, 0.03]}>
                            <mesh
                                ref={(box) => {
                                    boxes.current[i] = box;
                                }}
                                position={[-0.16, 0, 0]}
                                material={checked}
                            >
                                <boxGeometry args={[0.09, 0.09, 0.02]} />
                            </mesh>
                            <mesh position={[0.06, 0, 0]}>
                                <boxGeometry args={[0.26, 0.04, 0.015]} />
                                <meshStandardMaterial color="#64748b" />
                            </mesh>
                        </group>
                    ))}
                </group>
            </group>
        </group>
    );
}

export default Ambulance;
