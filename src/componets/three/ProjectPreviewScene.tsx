import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    BufferGeometry,
    MeshStandardMaterial,
    SphereGeometry,
    Vector3,
    type Group,
    type LineBasicMaterial,
    type Mesh,
    type MeshBasicMaterial,
} from 'three';
import SceneView from './SceneView';
import { useActiveLevel } from './sceneHooks';
import { idleMotion, lowPower, themeColor } from './sceneQuality';

interface PreviewProps {
    active: boolean;
}

const NODE_COUNT = 9;
const PULSE_COUNT = 4;

// Nine nodes spread over a flattened sphere, each linked to its two nearest neighbours
function networkLayout() {
    const nodes: Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i += 1) {
        const y = 1 - (i / (NODE_COUNT - 1)) * 2;
        const ring = Math.sqrt(1 - y * y);
        // golden angle, so the nodes never line up
        const angle = i * 2.39996;
        nodes.push(new Vector3(Math.cos(angle) * ring * 2.1, y, Math.sin(angle) * ring));
    }

    const edges: [number, number][] = [];
    const seen = new Set<string>();
    nodes.forEach((node, i) => {
        nodes
            .map((other, j) => ({ j, distance: node.distanceTo(other) }))
            .filter(({ j }) => j !== i)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2)
            .forEach(({ j }) => {
                const edge: [number, number] = [Math.min(i, j), Math.max(i, j)];
                const key = edge.join('-');
                if (!seen.has(key)) {
                    seen.add(key);
                    edges.push(edge);
                }
            });
    });
    return { nodes, edges };
}

// Connect Nine: a small community network with signals travelling between its members
function Network({ active }: PreviewProps) {
    const group = useRef<Group>(null);
    const lineMaterial = useRef<LineBasicMaterial>(null);
    const pulses = useRef<(Mesh | null)[]>([]);
    const nodeMaterials = useRef<(MeshStandardMaterial | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const { nodes, edges, lines, nodeGeometry, colors } = useMemo(() => {
        const layout = networkLayout();
        const blue = themeColor('--color-blue', '#539bef');
        return {
            ...layout,
            lines: new BufferGeometry().setFromPoints(
                layout.edges.flatMap(([a, b]) => [layout.nodes[a], layout.nodes[b]]),
            ),
            nodeGeometry: new SphereGeometry(0.13, lowPower ? 12 : 20, lowPower ? 8 : 14),
            colors: { blue, cyan: themeColor('--color-cyan', '#22d3ee') },
        };
    }, []);

    useEffect(
        () => () => {
            lines.dispose();
            nodeGeometry.dispose();
        },
        [lines, nodeGeometry],
    );

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.6 + lift * 1.6) * idleMotion;
        if (group.current) {
            group.current.rotation.y = time.current * 0.35;
        }
        if (lineMaterial.current) {
            lineMaterial.current.opacity = 0.3 + lift * 0.45;
        }
        nodeMaterials.current.forEach((material) => {
            if (material) {
                material.emissiveIntensity = 0.25 + lift * 0.9;
            }
        });
        pulses.current.forEach((pulse, i) => {
            if (!pulse) {
                return;
            }
            const progress = time.current * 0.9 + i / PULSE_COUNT;
            const [from, to] = edges[(Math.floor(progress) * 3 + i * 5) % edges.length];
            pulse.position.lerpVectors(nodes[from], nodes[to], progress % 1);
        });
    });

    return (
        <group rotation={[0.25, 0, 0]}>
            <group ref={group}>
                <lineSegments geometry={lines}>
                    <lineBasicMaterial ref={lineMaterial} color={colors.blue} transparent opacity={0.3} />
                </lineSegments>
                {nodes.map((node, i) => (
                    <mesh key={i} position={node} geometry={nodeGeometry}>
                        <meshStandardMaterial
                            ref={(material) => {
                                nodeMaterials.current[i] = material;
                            }}
                            color={colors.blue}
                            emissive={colors.blue}
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                ))}
                {/* still scenes have nothing travelling, so the signals only exist with motion */}
                {idleMotion > 0 &&
                    Array.from({ length: PULSE_COUNT }, (_, i) => (
                        <mesh
                            key={i}
                            ref={(mesh) => {
                                pulses.current[i] = mesh;
                            }}
                        >
                            <sphereGeometry args={[0.06, 10, 8]} />
                            <meshBasicMaterial color={colors.cyan} />
                        </mesh>
                    ))}
            </group>
        </group>
    );
}

const WALL = 0.04;
const BOX_WIDTH = 1.3;
const BOX_HEIGHT = 0.8;

// Nidar Store: a parcel whose flaps open and lets its products float up
function Parcel({ active }: PreviewProps) {
    const spin = useRef<Group>(null);
    const frontFlap = useRef<Group>(null);
    const backFlap = useRef<Group>(null);
    const items = useRef<(Group | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active, 4);

    const { wallMaterial, colors } = useMemo(() => {
        const purple = themeColor('--color-purple', '#a78bfa');
        return {
            wallMaterial: new MeshStandardMaterial({ color: purple, flatShading: true, metalness: 0.2, roughness: 0.45 }),
            colors: {
                purple,
                items: [
                    themeColor('--color-mint', '#2dd4bf'),
                    themeColor('--color-blue', '#539bef'),
                    themeColor('--color-cyan', '#22d3ee'),
                ],
            },
        };
    }, []);

    useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);

    useFrame((_, delta) => {
        const open = level.current;
        time.current += Math.min(delta, 0.1) * idleMotion;
        if (spin.current) {
            spin.current.rotation.y = time.current * 0.4;
        }
        // slightly ajar at rest, wide open while the card is active
        const angle = 0.3 + open * 1.9 + Math.sin(time.current * 1.5) * 0.08 * (1 - open);
        if (frontFlap.current) {
            frontFlap.current.rotation.x = angle;
        }
        if (backFlap.current) {
            backFlap.current.rotation.x = -angle;
        }
        items.current.forEach((item, i) => {
            if (item) {
                item.position.y = -0.55 + open * (1.05 + i * 0.25) + Math.sin(time.current * 2 + i) * 0.05 * open;
                item.rotation.y = time.current * (1 + i * 0.5);
                item.visible = open > 0.02;
            }
        });
    });

    const half = BOX_WIDTH / 2;

    return (
        <group rotation={[0.45, 0, 0]} position={[0, 0.15, 0]}>
            <group ref={spin}>
                <group position={[0, -0.5, 0]}>
                    <mesh position={[0, -BOX_HEIGHT / 2, 0]} material={wallMaterial}>
                        <boxGeometry args={[BOX_WIDTH, WALL, BOX_WIDTH]} />
                    </mesh>
                    <mesh position={[0, 0, half]} material={wallMaterial}>
                        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, WALL]} />
                    </mesh>
                    <mesh position={[0, 0, -half]} material={wallMaterial}>
                        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, WALL]} />
                    </mesh>
                    <mesh position={[half, 0, 0]} material={wallMaterial}>
                        <boxGeometry args={[WALL, BOX_HEIGHT, BOX_WIDTH]} />
                    </mesh>
                    <mesh position={[-half, 0, 0]} material={wallMaterial}>
                        <boxGeometry args={[WALL, BOX_HEIGHT, BOX_WIDTH]} />
                    </mesh>
                    {/* flaps hinge on the top edge of the front and back walls */}
                    <group ref={frontFlap} position={[0, BOX_HEIGHT / 2, half]}>
                        <mesh position={[0, 0, -half / 2]} material={wallMaterial}>
                            <boxGeometry args={[BOX_WIDTH, WALL, half]} />
                        </mesh>
                    </group>
                    <group ref={backFlap} position={[0, BOX_HEIGHT / 2, -half]}>
                        <mesh position={[0, 0, half / 2]} material={wallMaterial}>
                            <boxGeometry args={[BOX_WIDTH, WALL, half]} />
                        </mesh>
                    </group>
                </group>

                {colors.items.map((color, i) => (
                    <group
                        key={color}
                        ref={(item) => {
                            items.current[i] = item;
                        }}
                        position={[(i - 1) * 0.38, -0.55, (i % 2) * 0.2 - 0.1]}
                        visible={false}
                    >
                        <mesh>
                            {i === 0 && <sphereGeometry args={[0.17, 20, 14]} />}
                            {i === 1 && <boxGeometry args={[0.28, 0.28, 0.28]} />}
                            {i === 2 && <coneGeometry args={[0.17, 0.34, 16]} />}
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
                        </mesh>
                    </group>
                ))}
            </group>

            <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.25, 0.015, 6, lowPower ? 64 : 128]} />
                <meshBasicMaterial color={colors.purple} transparent opacity={0.55} />
            </mesh>
        </group>
    );
}

const WAVE_COUNT = 4;
const RECEIVER_DISTANCE = 1.8;

// Wireless AV: a transmitter sending signal waves that light up the screens around it
function Transmitter({ active }: PreviewProps) {
    const waves = useRef<(Mesh | null)[]>([]);
    const receivers = useRef<(MeshStandardMaterial | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const colors = useMemo(
        () => ({
            mint: themeColor('--color-mint', '#2dd4bf'),
            cyan: themeColor('--color-cyan', '#22d3ee'),
            navy: '#0d1e39',
        }),
        [],
    );

    useFrame((_, delta) => {
        const boost = level.current;
        time.current += Math.min(delta, 0.1) * (0.45 + boost * 0.8) * idleMotion;
        let signal = 0;
        waves.current.forEach((wave, i) => {
            if (!wave) {
                return;
            }
            // still scenes show the waves frozen at evenly spread radii
            const phase = (time.current + i / WAVE_COUNT) % 1;
            // the largest wave stays inside the canvas, so it fades out instead of being cut off
            const radius = 0.3 + phase * 1.7;
            wave.scale.setScalar(radius);
            (wave.material as MeshBasicMaterial).opacity = (1 - phase) * (0.45 + boost * 0.5);
            signal = Math.max(signal, Math.exp(-(((radius - RECEIVER_DISTANCE) / 0.3) ** 2)) * (1 - phase));
        });
        receivers.current.forEach((material) => {
            if (material) {
                material.emissiveIntensity = 0.15 + signal * (1.2 + boost);
            }
        });
    });

    // set back and level with the camera: the front of the tilted waves comes closer and looks bigger
    return (
        <group rotation={[0.5, 0, 0]} position={[0, 0.3, -0.6]}>
            <mesh position={[0, -0.25, 0]}>
                <cylinderGeometry args={[0.32, 0.4, 0.5, lowPower ? 16 : 32]} />
                <meshStandardMaterial color={colors.navy} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
                <meshStandardMaterial color={colors.mint} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
                <sphereGeometry args={[0.11, 20, 14]} />
                <meshStandardMaterial color={colors.mint} emissive={colors.mint} emissiveIntensity={1} />
            </mesh>

            {Array.from({ length: WAVE_COUNT }, (_, i) => (
                <mesh
                    key={i}
                    ref={(wave) => {
                        waves.current[i] = wave;
                    }}
                    position={[0, 0, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <torusGeometry args={[1, 0.012, 6, lowPower ? 64 : 128]} />
                    <meshBasicMaterial color={colors.cyan} transparent opacity={0.4} depthWrite={false} />
                </mesh>
            ))}

            {[-1, 1].map((side, i) => (
                <group key={side} position={[side * RECEIVER_DISTANCE, 0.2, 0]} rotation={[0, -side * 0.5, 0]}>
                    <mesh>
                        <boxGeometry args={[0.75, 0.48, 0.05]} />
                        <meshStandardMaterial
                            ref={(material) => {
                                receivers.current[i] = material;
                            }}
                            color={colors.navy}
                            emissive={colors.cyan}
                            emissiveIntensity={0.15}
                        />
                    </mesh>
                    <mesh position={[0, -0.32, 0]}>
                        <boxGeometry args={[0.06, 0.18, 0.06]} />
                        <meshStandardMaterial color={colors.navy} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// One preview per project, in the order of the project list
const PREVIEWS = [Network, Parcel, Transmitter];

function ProjectPreviewScene({ inView, variant, active }: PreviewProps & { inView: boolean; variant: number }) {
    const Preview = PREVIEWS[variant % PREVIEWS.length];
    return (
        <SceneView inView={inView} camera={{ position: [0, 0.3, 5], fov: 35 }}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[2, 4, 5]} intensity={2.4} />
            <pointLight position={[-3, -1, 2]} intensity={10} color="#22d3ee" />
            <Preview active={active} />
        </SceneView>
    );
}

export default ProjectPreviewScene;
