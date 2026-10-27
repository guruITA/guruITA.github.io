import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import SceneView from './SceneView';
import { approach, idleMotion, lowPower, themeColor } from './sceneQuality';

const RINGS = [
    { radius: 1.4, color: '--color-mint', fallback: '#2dd4bf', axis: 'x', speed: 0.5 },
    { radius: 1.12, color: '--color-blue', fallback: '#539bef', axis: 'y', speed: -0.7 },
    { radius: 0.84, color: '--color-purple', fallback: '#a78bfa', axis: 'x', speed: 0.9 },
] as const;

// Gyroscope rings that spin around a glowing core and speed up while the page scrolls
function Gyroscope() {
    const rings = useRef<(Group | null)[]>([]);
    const scrollBoost = useRef(0);
    const lastScroll = useRef(0);

    const ringColors = useMemo(() => RINGS.map((ring) => themeColor(ring.color, ring.fallback)), []);
    const core = useMemo(() => themeColor('--color-cyan', '#22d3ee'), []);

    useEffect(() => {
        lastScroll.current = window.scrollY;
        const onScroll = () => {
            const distance = Math.abs(window.scrollY - lastScroll.current);
            lastScroll.current = window.scrollY;
            scrollBoost.current = Math.min(scrollBoost.current + distance * 0.02, 5);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useFrame((_, delta) => {
        scrollBoost.current = approach(scrollBoost.current, 0, 1.6, delta);
        const step = Math.min(delta, 0.1) * idleMotion;
        RINGS.forEach((ring, index) => {
            const group = rings.current[index];
            if (group) {
                group.rotation[ring.axis] += step * ring.speed * (1 + scrollBoost.current);
            }
        });
    });

    const segments = lowPower ? 64 : 128;

    return (
        <group rotation={[0.5, -0.6, 0]}>
            {RINGS.map((ring, index) => (
                <group
                    key={ring.radius}
                    ref={(group) => {
                        rings.current[index] = group;
                    }}
                    rotation={[index * 0.9, index * 0.6, 0]}
                >
                    <mesh>
                        <torusGeometry args={[ring.radius, 0.045, 12, segments]} />
                        <meshStandardMaterial
                            color={ringColors[index]}
                            emissive={ringColors[index]}
                            emissiveIntensity={0.25}
                            metalness={0.55}
                            roughness={0.3}
                        />
                    </mesh>
                </group>
            ))}
            <mesh>
                <sphereGeometry args={[0.3, 32, 24]} />
                <meshStandardMaterial color={core} emissive={core} emissiveIntensity={0.9} />
            </mesh>
        </group>
    );
}

function AboutRingsScene({ inView }: { inView: boolean }) {
    return (
        <SceneView inView={inView} camera={{ position: [0, 0, 5], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={2.4} />
            <pointLight position={[0, 0, 0]} intensity={4} color="#22d3ee" />
            <Gyroscope />
        </SceneView>
    );
}

export default AboutRingsScene;
