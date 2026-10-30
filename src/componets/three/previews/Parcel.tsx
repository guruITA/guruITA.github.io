import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, type Group } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const WALL = 0.04;
const BOX_WIDTH = 1.3;
const BOX_HEIGHT = 0.8;

// Retro Game Store: a parcel whose flaps open and lets its products float up
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

export default Parcel;
