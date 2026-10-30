import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4, type Group, type InstancedMesh, type Mesh } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

// rows of the half circle, from the front to the back
const ROWS = [
    { radius: 0.85, seats: 9 },
    { radius: 1.15, seats: 13 },
    { radius: 1.45, seats: 16 },
    { radius: 1.75, seats: 20 },
];
// where each party block ends, as a share of the half circle
const PARTY_ENDS = [0.17, 0.35, 0.55, 0.72, 0.86, 1];
const BOX_TOP = 0.2;

function seatLayout() {
    return ROWS.flatMap(({ radius, seats }) =>
        Array.from({ length: seats }, (_, k) => {
            const share = (k + 0.5) / seats;
            const angle = Math.PI * share;
            return { share, x: -Math.cos(angle) * radius, z: -Math.sin(angle) * radius };
        }),
    );
}

// PolitiXplore: the seats of the Tweede Kamer in party colours, with a light sweeping over them as the
// votes are counted, and a ballot going into the ballot box
function Hemicycle({ active }: PreviewProps) {
    const seatsRef = useRef<InstancedMesh>(null);
    const ballot = useRef<Mesh>(null);
    const sway = useRef<Group>(null);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const { seats, partyColors, colors } = useMemo(() => {
        const palette = [
            themeColor('--color-purple', '#a78bfa'),
            themeColor('--color-blue', '#539bef'),
            themeColor('--color-cyan', '#22d3ee'),
            themeColor('--color-mint', '#2dd4bf'),
            '#f59e0b',
            '#f472b6',
        ].map((hex) => new Color(hex));
        const layout = seatLayout();
        return {
            seats: layout,
            partyColors: layout.map(({ share }) => palette[PARTY_ENDS.findIndex((end) => share <= end)]),
            colors: { navy: '#0d1e39', mint: themeColor('--color-mint', '#2dd4bf') },
        };
    }, []);

    const shade = useMemo(() => new Color(), []);

    useLayoutEffect(() => {
        const mesh = seatsRef.current;
        if (!mesh) {
            return;
        }
        const matrix = new Matrix4();
        seats.forEach(({ x, z }, i) => {
            mesh.setMatrixAt(i, matrix.makeTranslation(x, 0, z));
            mesh.setColorAt(i, shade.copy(partyColors[i]).multiplyScalar(0.7));
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
    }, [seats, partyColors, shade]);

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.6 + lift * 1.2) * idleMotion;
        const t = time.current;
        if (sway.current) {
            sway.current.rotation.y = Math.sin(t * 0.4) * 0.25;
        }
        const mesh = seatsRef.current;
        if (mesh && idleMotion > 0) {
            // the sweep runs a little past both ends, so it fades in and out at the sides
            const sweep = ((t * 0.35) % 1.4) - 0.2;
            seats.forEach(({ share }, i) => {
                const glow = Math.exp(-(((share - sweep) / 0.07) ** 2));
                mesh.setColorAt(i, shade.copy(partyColors[i]).multiplyScalar(0.6 + lift * 0.3 + glow * 0.9));
            });
            if (mesh.instanceColor) {
                mesh.instanceColor.needsUpdate = true;
            }
        }
        if (ballot.current) {
            // drops from above through the slot until it is all inside the box, then the next one comes
            const progress = (t * 0.5) % 1;
            ballot.current.position.y = 0.85 - progress * 0.85;
        }
    });

    return (
        <group rotation={[0.6, 0, 0]} position={[0, -0.25, 0.2]}>
            <group ref={sway}>
                <instancedMesh ref={seatsRef} args={[undefined, undefined, seats.length]}>
                    <sphereGeometry args={[0.075, 12, 10]} />
                    <meshStandardMaterial roughness={0.4} />
                </instancedMesh>

                <mesh position={[0, BOX_TOP - 0.2, 0.25]}>
                    <boxGeometry args={[0.55, 0.4, 0.4]} />
                    <meshStandardMaterial color={colors.navy} metalness={0.4} roughness={0.4} />
                </mesh>
                <mesh position={[0, BOX_TOP + 0.003, 0.25]}>
                    <boxGeometry args={[0.32, 0.01, 0.05]} />
                    <meshBasicMaterial color={colors.mint} />
                </mesh>
                <mesh ref={ballot} position={[0, 0.85, 0.25]}>
                    <boxGeometry args={[0.28, 0.34, 0.015]} />
                    <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.2} />
                </mesh>
            </group>
        </group>
    );
}

export default Hemicycle;
