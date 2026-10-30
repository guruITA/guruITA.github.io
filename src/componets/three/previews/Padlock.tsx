import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

const SHACKLE = 0.24;
const ORBIT = 1.1;

// City of Shadows: the locked room's padlock, searched by a magnifying glass; hovering cracks the code
// and the shackle swings open
function Padlock({ active }: PreviewProps) {
    const lock = useRef<Group>(null);
    const shackle = useRef<Group>(null);
    const orbit = useRef<Group>(null);
    const glass = useRef<Group>(null);
    const time = useRef(0);
    const level = useActiveLevel(active, 4);

    const colors = useMemo(
        () => ({
            gold: '#d4a64a',
            dark: '#0b1630',
            cyan: themeColor('--color-cyan', '#22d3ee'),
            purple: themeColor('--color-purple', '#a78bfa'),
        }),
        [],
    );

    useFrame((_, delta) => {
        const open = level.current;
        time.current += Math.min(delta, 0.1) * idleMotion;
        const t = time.current;
        // someone tries the lock: it rattles until it opens
        if (lock.current) {
            lock.current.rotation.z = Math.sin(t * 1.4) * 0.07 * (1 - open);
            lock.current.rotation.y = Math.sin(t * 0.5) * 0.3;
        }
        if (shackle.current) {
            shackle.current.position.y = open * 0.17;
            shackle.current.rotation.y = open * 1.1;
        }
        if (orbit.current) {
            orbit.current.rotation.y = 0.9 + t * 0.6;
        }
        // the glass keeps facing the camera while it circles the lock
        if (glass.current && orbit.current) {
            glass.current.rotation.y = -orbit.current.rotation.y;
        }
    });

    return (
        <group rotation={[0.15, 0, 0]} position={[0, 0.15, 0]} scale={1.3}>
            <group ref={lock}>
                <RoundedBox args={[0.82, 0.62, 0.32]} radius={0.07} smoothness={lowPower ? 2 : 4} position={[0, -0.3, 0]}>
                    <meshStandardMaterial color={colors.gold} metalness={0.65} roughness={0.3} />
                </RoundedBox>
                <mesh position={[0, -0.24, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.065, 0.065, 0.02, 20]} />
                    <meshStandardMaterial color={colors.dark} />
                </mesh>
                <mesh position={[0, -0.35, 0.165]}>
                    <boxGeometry args={[0.05, 0.14, 0.02]} />
                    <meshStandardMaterial color={colors.dark} />
                </mesh>

                {/* the shackle turns around its left leg, so the right leg swings out of the body */}
                <group position={[-SHACKLE, 0, 0]}>
                    <group ref={shackle}>
                        <group position={[SHACKLE, 0, 0]}>
                            <mesh position={[0, 0.24, 0]}>
                                <torusGeometry args={[SHACKLE, 0.05, 12, lowPower ? 20 : 40, Math.PI]} />
                                <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
                            </mesh>
                            {[-1, 1].map((side) => (
                                <mesh key={side} position={[side * SHACKLE, 0.11, 0]}>
                                    <cylinderGeometry args={[0.05, 0.05, 0.26, 12]} />
                                    <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
                                </mesh>
                            ))}
                        </group>
                    </group>
                </group>
            </group>

            <group ref={orbit}>
                <group ref={glass} position={[ORBIT, 0, 0]}>
                    <group rotation={[0, 0, -0.5]}>
                        <mesh>
                            <torusGeometry args={[0.22, 0.03, 10, lowPower ? 24 : 48]} />
                            <meshStandardMaterial color={colors.purple} metalness={0.5} roughness={0.3} />
                        </mesh>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.2, 0.2, 0.01, lowPower ? 24 : 48]} />
                            <meshStandardMaterial
                                color={colors.cyan}
                                emissive={colors.cyan}
                                emissiveIntensity={0.4}
                                transparent
                                opacity={0.3}
                                depthWrite={false}
                            />
                        </mesh>
                        <mesh position={[0, -0.4, 0]}>
                            <cylinderGeometry args={[0.035, 0.035, 0.34, 10]} />
                            <meshStandardMaterial color={colors.purple} />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
}

export default Padlock;
