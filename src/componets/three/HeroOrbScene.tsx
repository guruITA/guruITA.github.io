import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import SceneCanvas from './SceneCanvas';
import { approach, idleMotion, lowPower, themeColor } from './sceneQuality';

// A wireframe orb with two orbit rings around the profile photo; it leans towards the mouse
function Orb() {
    const tilt = useRef<Group>(null);
    const spin = useRef<Group>(null);
    const innerRing = useRef<Group>(null);
    const outerRing = useRef<Group>(null);
    const pointer = useRef({ x: 0, y: 0 });

    const colors = useMemo(
        () => ({
            blue: themeColor('--color-blue', '#539bef'),
            cyan: themeColor('--color-cyan', '#22d3ee'),
            mint: themeColor('--color-mint', '#2dd4bf'),
            purple: themeColor('--color-purple', '#a78bfa'),
        }),
        [],
    );

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        return () => window.removeEventListener('pointermove', onPointerMove);
    }, []);

    useFrame((_, delta) => {
        const step = Math.min(delta, 0.1) * idleMotion;
        if (tilt.current) {
            tilt.current.rotation.x = approach(tilt.current.rotation.x, pointer.current.y * 0.35, 3, delta);
            tilt.current.rotation.y = approach(tilt.current.rotation.y, pointer.current.x * 0.45, 3, delta);
        }
        if (spin.current) {
            spin.current.rotation.y += step * 0.22;
        }
        if (innerRing.current) {
            innerRing.current.rotation.z += step * 0.55;
        }
        if (outerRing.current) {
            outerRing.current.rotation.z -= step * 0.35;
        }
    });

    const detail = lowPower ? 1 : 2;

    return (
        <group ref={tilt}>
            <group ref={spin}>
                <mesh>
                    <icosahedronGeometry args={[1.3, detail]} />
                    <meshBasicMaterial color={colors.blue} wireframe transparent opacity={0.32} />
                </mesh>
                <points>
                    <icosahedronGeometry args={[1.3, detail]} />
                    <pointsMaterial color={colors.cyan} size={0.05} transparent opacity={0.85} />
                </points>
            </group>

            <group rotation={[1.15, 0.2, 0]}>
                <group ref={innerRing}>
                    <mesh>
                        <torusGeometry args={[1.6, 0.008, 6, lowPower ? 96 : 160]} />
                        <meshBasicMaterial color={colors.mint} transparent opacity={0.55} />
                    </mesh>
                    <mesh position={[1.6, 0, 0]}>
                        <sphereGeometry args={[0.07, 16, 12]} />
                        <meshBasicMaterial color={colors.mint} />
                    </mesh>
                </group>
            </group>

            <group rotation={[1.35, -0.45, 0.3]}>
                <group ref={outerRing}>
                    <mesh>
                        <torusGeometry args={[1.85, 0.006, 6, lowPower ? 96 : 160]} />
                        <meshBasicMaterial color={colors.purple} transparent opacity={0.4} />
                    </mesh>
                    <mesh position={[0, 1.85, 0]}>
                        <sphereGeometry args={[0.05, 16, 12]} />
                        <meshBasicMaterial color={colors.purple} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

function HeroOrbScene({ inView }: { inView: boolean }) {
    return (
        <SceneCanvas inView={inView} camera={{ position: [0, 0, 6], fov: 40 }}>
            <Orb />
        </SceneCanvas>
    );
}

export default HeroOrbScene;
