import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ExtrudeGeometry, Shape, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import SceneCanvas from './SceneCanvas';
import { useActiveLevel } from './sceneHooks';
import { idleMotion, lowPower, themeColor } from './sceneQuality';

interface IconProps {
    active: boolean;
}

// Frontend: three browser windows that fan out while the card is hovered
function BrowserWindows({ active }: IconProps) {
    const group = useRef<Group>(null);
    const windows = useRef<(Group | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);
    const blue = useMemo(() => themeColor('--color-blue', '#539bef'), []);

    useFrame((_, delta) => {
        time.current += Math.min(delta, 0.1) * idleMotion;
        if (group.current) {
            group.current.rotation.y = -0.45 + Math.sin(time.current * 0.8) * 0.25;
        }
        const spread = 1 + level.current * 0.8;
        windows.current.forEach((pane, i) => {
            pane?.position.set((i - 1) * 0.28 * spread, (1 - i) * 0.2 * spread, (i - 1) * 0.35 * spread);
        });
    });

    return (
        <group ref={group} rotation={[0.2, 0, 0]}>
            {[0, 1, 2].map((i) => (
                <group
                    key={i}
                    ref={(pane) => {
                        windows.current[i] = pane;
                    }}
                >
                    <mesh>
                        <boxGeometry args={[1.5, 1, 0.04]} />
                        <meshStandardMaterial color="#0d1e39" emissive={blue} emissiveIntensity={0.12} />
                    </mesh>
                    {/* title bar and two content lines */}
                    <mesh position={[0, 0.42, 0.01]}>
                        <boxGeometry args={[1.5, 0.16, 0.05]} />
                        <meshStandardMaterial color={blue} emissive={blue} emissiveIntensity={0.3} />
                    </mesh>
                    <mesh position={[-0.2, 0.05, 0.03]}>
                        <boxGeometry args={[0.9, 0.08, 0.02]} />
                        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.55} />
                    </mesh>
                    <mesh position={[-0.35, -0.15, 0.03]}>
                        <boxGeometry args={[0.6, 0.08, 0.02]} />
                        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.35} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// Backend: a stack of servers with blinking status lights; the stack opens up while hovered
function ServerStack({ active }: IconProps) {
    const group = useRef<Group>(null);
    const servers = useRef<(Group | null)[]>([]);
    const lights = useRef<(MeshStandardMaterial | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);
    const mint = useMemo(() => themeColor('--color-mint', '#2dd4bf'), []);

    useFrame((_, delta) => {
        const boost = level.current;
        time.current += Math.min(delta, 0.1) * (1 + boost * 1.5) * idleMotion;
        if (group.current) {
            group.current.rotation.y = -0.6 + Math.sin(time.current * 0.6) * 0.15;
        }
        const gap = 0.42 + boost * 0.18;
        servers.current.forEach((server, i) => {
            server?.position.set(0, (1 - i) * gap, 0);
        });
        lights.current.forEach((light, i) => {
            if (light) {
                // still scenes keep every light on
                const blink = idleMotion === 0 || Math.sin(time.current * 5 + i * 2.1) > -0.2;
                light.emissiveIntensity = blink ? 1.4 : 0.1;
            }
        });
    });

    return (
        <group ref={group} rotation={[0.35, 0, 0]}>
            {[0, 1, 2].map((i) => (
                <group
                    key={i}
                    ref={(server) => {
                        servers.current[i] = server;
                    }}
                >
                    <mesh>
                        <boxGeometry args={[1.5, 0.32, 0.9]} />
                        <meshStandardMaterial color="#1d5a5c" emissive={mint} emissiveIntensity={0.08} metalness={0.3} roughness={0.4} />
                    </mesh>
                    <mesh position={[-0.15, 0, 0.455]}>
                        <boxGeometry args={[0.9, 0.06, 0.01]} />
                        <meshBasicMaterial color={mint} transparent opacity={0.45} />
                    </mesh>
                    <mesh position={[0.55, 0, 0.47]}>
                        <sphereGeometry args={[0.06, 12, 8]} />
                        <meshStandardMaterial
                            ref={(light) => {
                                lights.current[i] = light;
                            }}
                            color={mint}
                            emissive={mint}
                            emissiveIntensity={1.4}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const GEAR_TEETH = 10;

function gearGeometry() {
    const shape = new Shape();
    const step = (Math.PI * 2) / GEAR_TEETH;
    for (let tooth = 0; tooth < GEAR_TEETH; tooth += 1) {
        const start = tooth * step;
        // root, rising flank, tooth top, falling flank
        const points: [number, number][] = [
            [0.72, start],
            [0.95, start + step * 0.2],
            [0.95, start + step * 0.5],
            [0.72, start + step * 0.7],
        ];
        points.forEach(([radius, angle], i) => {
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (tooth === 0 && i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        });
    }
    shape.closePath();
    const hole = new Shape();
    hole.absarc(0, 0, 0.28, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geometry = new ExtrudeGeometry(shape, {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 1,
        curveSegments: lowPower ? 12 : 24,
    });
    geometry.center();
    return geometry;
}

// Engineering: a gear that turns steadily and spins up while hovered
function Gear({ active }: IconProps) {
    const gear = useRef<Mesh>(null);
    const level = useActiveLevel(active);
    const purple = useMemo(() => themeColor('--color-purple', '#a78bfa'), []);
    const geometry = useMemo(() => gearGeometry(), []);

    useEffect(() => () => geometry.dispose(), [geometry]);

    useFrame((_, delta) => {
        if (gear.current) {
            gear.current.rotation.z -= Math.min(delta, 0.1) * (0.6 + level.current * 2.4) * idleMotion;
        }
    });

    return (
        <group rotation={[-0.45, 0.5, 0]}>
            <mesh ref={gear} geometry={geometry}>
                <meshStandardMaterial color={purple} emissive={purple} emissiveIntensity={0.12} metalness={0.45} roughness={0.3} />
            </mesh>
        </group>
    );
}

// 3D & exploration: a torus knot tumbling through space
function TorusKnot({ active }: IconProps) {
    const knot = useRef<Mesh>(null);
    const level = useActiveLevel(active);
    const cyan = useMemo(() => themeColor('--color-cyan', '#22d3ee'), []);

    useFrame((_, delta) => {
        if (knot.current) {
            const step = Math.min(delta, 0.1) * (0.5 + level.current * 2) * idleMotion;
            knot.current.rotation.x += step * 0.7;
            knot.current.rotation.y += step;
            knot.current.scale.setScalar(1 + level.current * 0.1);
        }
    });

    return (
        <mesh ref={knot} rotation={[0.4, 0.3, 0]}>
            <torusKnotGeometry args={[0.62, 0.2, lowPower ? 64 : 128, lowPower ? 8 : 16]} />
            <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={0.15} metalness={0.4} roughness={0.25} />
        </mesh>
    );
}

// One icon per skill, in the order of the skill list
const ICONS = [BrowserWindows, ServerStack, Gear, TorusKnot];

function SkillIconScene({ inView, variant, active }: IconProps & { inView: boolean; variant: number }) {
    const Icon = ICONS[variant % ICONS.length];
    return (
        <SceneCanvas inView={inView} camera={{ position: [0, 0, 4], fov: 35 }}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[2, 3, 4]} intensity={2.4} />
            <pointLight position={[-3, -1, 2]} intensity={8} color="#22d3ee" />
            <Icon active={active} />
        </SceneCanvas>
    );
}

export default SkillIconScene;
