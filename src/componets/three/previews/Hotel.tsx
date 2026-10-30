import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, type Group, type Mesh } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const WIDTH = 1.0;
const HEIGHT = 1.45;
const DEPTH = 0.7;
const BOTTOM = -0.88;
const FLOORS = 4;

// every window of the front (3 per floor) and the right side (2 per floor), in the order they fill up
function windowLayout() {
    const windows: { position: [number, number, number]; side: boolean }[] = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
        const y = BOTTOM + 0.46 + floor * 0.27;
        for (let column = 0; column < 3; column += 1) {
            windows.push({ position: [(column - 1) * 0.3, y, DEPTH / 2 + 0.006], side: false });
        }
        for (let column = 0; column < 2; column += 1) {
            windows.push({ position: [WIDTH / 2 + 0.006, y, (column - 0.5) * 0.3], side: true });
        }
    }
    return windows;
}

// Hotel ter Duin: a hotel whose rooms light up one by one as they get booked; hovering books them all
function Hotel({ active }: PreviewProps) {
    const turn = useRef<Group>(null);
    const panes = useRef<(Mesh | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const { windows, lit, dark, colors } = useMemo(
        () => ({
            windows: windowLayout(),
            lit: new MeshStandardMaterial({ color: '#fde68a', emissive: '#fbbf24', emissiveIntensity: 1 }),
            dark: new MeshStandardMaterial({ color: '#0b1630', emissive: '#22d3ee', emissiveIntensity: 0.08 }),
            colors: {
                wall: '#1b2d55',
                roof: '#0d1e39',
                cyan: themeColor('--color-cyan', '#22d3ee'),
                mint: themeColor('--color-mint', '#2dd4bf'),
                blue: themeColor('--color-blue', '#539bef'),
            },
        }),
        [],
    );

    useEffect(
        () => () => {
            lit.dispose();
            dark.dispose();
        },
        [lit, dark],
    );

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * idleMotion;
        const t = time.current;
        if (turn.current) {
            turn.current.rotation.y = -0.55 + Math.sin(t * 0.4) * 0.35;
        }
        // the rooms fill up one by one, stay full for a moment, then the next guests come;
        // still scenes show a hotel that is two thirds full
        const booked = idleMotion > 0 ? Math.floor(t * 2.2) % (windows.length + 6) : -1;
        panes.current.forEach((pane, i) => {
            if (pane) {
                const on = lift > 0.5 || (booked < 0 ? i % 3 !== 0 : i < booked);
                pane.material = on ? lit : dark;
            }
        });
    });

    return (
        <group rotation={[0.22, 0, 0]} position={[0, 0.05, 0]}>
            <group ref={turn}>
                <mesh position={[0, BOTTOM + HEIGHT / 2, 0]}>
                    <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
                    <meshStandardMaterial color={colors.wall} metalness={0.25} roughness={0.55} />
                </mesh>
                <mesh position={[0, BOTTOM + HEIGHT + 0.025, 0]}>
                    <boxGeometry args={[WIDTH + 0.08, 0.05, DEPTH + 0.08]} />
                    <meshStandardMaterial color={colors.roof} />
                </mesh>
                <mesh position={[0, BOTTOM + HEIGHT + 0.13, DEPTH / 2 - 0.08]}>
                    <boxGeometry args={[0.62, 0.14, 0.04]} />
                    <meshStandardMaterial color={colors.cyan} emissive={colors.cyan} emissiveIntensity={0.9} />
                </mesh>
                <mesh position={[0, BOTTOM + 0.15, DEPTH / 2 + 0.008]}>
                    <boxGeometry args={[0.22, 0.3, 0.02]} />
                    <meshStandardMaterial color={colors.mint} emissive={colors.mint} emissiveIntensity={0.7} />
                </mesh>
                {windows.map(({ position, side }, i) => (
                    <mesh
                        key={i}
                        ref={(pane) => {
                            panes.current[i] = pane;
                        }}
                        position={position}
                        rotation={[0, side ? Math.PI / 2 : 0, 0]}
                        material={i % 3 !== 0 ? lit : dark}
                    >
                        <boxGeometry args={[0.18, 0.15, 0.012]} />
                    </mesh>
                ))}
            </group>

            <mesh position={[0, BOTTOM - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.0, 0.015, 6, lowPower ? 64 : 128]} />
                <meshBasicMaterial color={colors.blue} transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

export default Hotel;
