import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const STEP = 0.66;
const TILE = 0.6;
const GROUND = -0.46;
// building height on each tile of the 3 by 3 city, 0 for the street tiles
const HEIGHTS = [0.5, 0, 0.3, 0, 0.75, 0, 0.35, 0, 0.55];
const BUILDINGS = HEIGHTS.flatMap((height, tile) => (height > 0 ? [tile] : []));
const HUB_Y = 1.05;
const PULSE_COUNT = 5;

function tilePosition(tile: number): [number, number] {
    return [((tile % 3) - 1) * STEP, (Math.floor(tile / 3) - 1) * STEP];
}

// City Sim: a 3 by 3 model city with a streetlight and a traffic light, whose tiles send their sensor
// data up to the backend
function CityTiles({ active }: PreviewProps) {
    const spin = useRef<Group>(null);
    const bulb = useRef<MeshStandardMaterial>(null);
    const red = useRef<MeshStandardMaterial>(null);
    const green = useRef<MeshStandardMaterial>(null);
    const hub = useRef<MeshStandardMaterial>(null);
    const pulses = useRef<(Mesh | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const colors = useMemo(
        () => ({
            blue: themeColor('--color-blue', '#539bef'),
            cyan: themeColor('--color-cyan', '#22d3ee'),
            mint: themeColor('--color-mint', '#2dd4bf'),
            tile: '#132a4d',
            navy: '#0d1e39',
        }),
        [],
    );

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.6 + lift * 1.4) * idleMotion;
        const t = time.current;
        if (spin.current) {
            spin.current.rotation.y = 0.6 + t * 0.25;
        }
        // the streetlight comes on as it gets dark, the traffic light switches every two seconds
        if (bulb.current) {
            bulb.current.emissiveIntensity = 0.3 + (0.5 + 0.5 * Math.sin(t * 0.9)) * 1.4;
        }
        const stop = Math.floor(t * 0.5) % 2 === 0;
        if (red.current) {
            red.current.emissiveIntensity = stop ? 1.6 : 0.1;
        }
        if (green.current) {
            green.current.emissiveIntensity = stop ? 0.1 : 1.6;
        }
        let arrived = 0;
        pulses.current.forEach((pulse, i) => {
            if (!pulse) {
                return;
            }
            const progress = (t * 0.55 + i / PULSE_COUNT) % 1;
            const tile = BUILDINGS[i % BUILDINGS.length];
            const [x, z] = tilePosition(tile);
            const top = GROUND + HEIGHTS[tile];
            pulse.position.set(x * (1 - progress), top + (HUB_Y - top) * progress, z * (1 - progress));
            arrived = Math.max(arrived, Math.exp(-(((progress - 1) / 0.08) ** 2)));
        });
        if (hub.current) {
            hub.current.emissiveIntensity = 0.4 + lift * 0.6 + arrived * 1.2;
        }
    });

    const [lightX, lightZ] = tilePosition(1);
    const [trafficX, trafficZ] = tilePosition(5);

    return (
        <group rotation={[0.5, 0, 0]} position={[0, -0.02, 0]} scale={0.8}>
            <group ref={spin}>
                {HEIGHTS.map((height, tile) => {
                    const [x, z] = tilePosition(tile);
                    return (
                        <group key={tile} position={[x, 0, z]}>
                            <mesh position={[0, GROUND - 0.04, 0]}>
                                <boxGeometry args={[TILE, 0.08, TILE]} />
                                <meshStandardMaterial color={colors.tile} metalness={0.3} roughness={0.6} />
                            </mesh>
                            {height > 0 && (
                                <mesh position={[0, GROUND + height / 2, 0]}>
                                    <boxGeometry args={[0.34, height, 0.34]} />
                                    <meshStandardMaterial
                                        color={colors.blue}
                                        emissive={colors.blue}
                                        emissiveIntensity={0.15}
                                        flatShading
                                    />
                                </mesh>
                            )}
                            {/* street tiles without a lamp or light get a road marking */}
                            {height === 0 && tile !== 1 && tile !== 5 && (
                                <mesh position={[0, GROUND + 0.005, 0]}>
                                    <boxGeometry args={[TILE * 0.85, 0.01, 0.05]} />
                                    <meshBasicMaterial color={colors.mint} transparent opacity={0.5} />
                                </mesh>
                            )}
                        </group>
                    );
                })}

                <group position={[lightX, GROUND, lightZ]}>
                    <mesh position={[0, 0.22, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.44, 8]} />
                        <meshStandardMaterial color={colors.navy} />
                    </mesh>
                    <mesh position={[0, 0.47, 0]}>
                        <sphereGeometry args={[0.07, 16, 12]} />
                        <meshStandardMaterial ref={bulb} color="#fde68a" emissive="#fbbf24" emissiveIntensity={1} />
                    </mesh>
                </group>

                <group position={[trafficX, GROUND, trafficZ]}>
                    <mesh position={[0, 0.17, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.34, 8]} />
                        <meshStandardMaterial color={colors.navy} />
                    </mesh>
                    <mesh position={[0, 0.42, 0]}>
                        <boxGeometry args={[0.11, 0.22, 0.09]} />
                        <meshStandardMaterial color={colors.navy} />
                    </mesh>
                    <mesh position={[0, 0.47, 0.05]}>
                        <sphereGeometry args={[0.035, 10, 8]} />
                        <meshStandardMaterial ref={red} color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.6} />
                    </mesh>
                    <mesh position={[0, 0.37, 0.05]}>
                        <sphereGeometry args={[0.035, 10, 8]} />
                        <meshStandardMaterial ref={green} color="#14532d" emissive="#22c55e" emissiveIntensity={0.1} />
                    </mesh>
                </group>

                {/* the backend all tiles report to */}
                <group position={[0, HUB_Y, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.28, 0.025, 8, lowPower ? 32 : 64]} />
                        <meshStandardMaterial color={colors.cyan} emissive={colors.cyan} emissiveIntensity={0.6} />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.1, 20, 14]} />
                        <meshStandardMaterial ref={hub} color={colors.mint} emissive={colors.mint} emissiveIntensity={0.4} />
                    </mesh>
                </group>

                {/* still scenes have nothing travelling, so the data only exists with motion */}
                {idleMotion > 0 &&
                    Array.from({ length: PULSE_COUNT }, (_, i) => (
                        <mesh
                            key={i}
                            ref={(mesh) => {
                                pulses.current[i] = mesh;
                            }}
                        >
                            <sphereGeometry args={[0.045, 10, 8]} />
                            <meshBasicMaterial color={colors.cyan} />
                        </mesh>
                    ))}
            </group>
        </group>
    );
}

export default CityTiles;
