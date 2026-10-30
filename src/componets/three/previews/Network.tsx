import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    BufferGeometry,
    SphereGeometry,
    Vector3,
    type Group,
    type LineBasicMaterial,
    type Mesh,
    type MeshStandardMaterial,
} from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

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

// Connect: a small community network with signals travelling between its members
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

export default Network;
