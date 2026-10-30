import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial, type Group, type Mesh } from 'three';
import { useActiveLevel } from '../sceneHooks';
import { idleMotion, lowPower, themeColor } from '../sceneQuality';
import type { PreviewProps } from './types';

// the code in the answer: width and indent of each line
const LINES = [
    { width: 0.85, indent: 0 },
    { width: 0.55, indent: 0.15 },
    { width: 0.7, indent: 0.15 },
];
const STARS = 5;
const ANSWER_X = 0.55;
const ANSWER_Y = -0.25;
const LINE_LEFT = ANSWER_X - 0.58;

// Code Exchange: a question being typed, an answer with code, and the rating it gets
function Bubbles({ active }: PreviewProps) {
    const sway = useRef<Group>(null);
    const dots = useRef<(Mesh | null)[]>([]);
    const lines = useRef<(Mesh | null)[]>([]);
    const stars = useRef<(Mesh | null)[]>([]);
    const time = useRef(0);
    const level = useActiveLevel(active);

    const { colors, starOn, starOff } = useMemo(() => {
        const mint = themeColor('--color-mint', '#2dd4bf');
        const cyan = themeColor('--color-cyan', '#22d3ee');
        return {
            colors: {
                question: themeColor('--color-purple', '#a78bfa'),
                answer: '#1d4ed8',
                lines: [mint, cyan, '#e2e8f0'],
            },
            starOn: new MeshStandardMaterial({ color: '#fde68a', emissive: '#fbbf24', emissiveIntensity: 1.1 }),
            starOff: new MeshStandardMaterial({ color: '#64748b' }),
        };
    }, []);

    useEffect(
        () => () => {
            starOn.dispose();
            starOff.dispose();
        },
        [starOn, starOff],
    );

    useFrame((_, delta) => {
        const lift = level.current;
        time.current += Math.min(delta, 0.1) * (0.8 + lift * 1.2) * idleMotion;
        const t = time.current;
        if (sway.current) {
            sway.current.rotation.y = Math.sin(t * 0.5) * 0.3;
        }
        dots.current.forEach((dot, i) => {
            if (dot) {
                dot.position.y = 0.42 + Math.max(0, Math.sin(t * 5 - i * 0.8)) * 0.07;
            }
        });
        // one round: the answer is typed line by line, then the stars light up; still scenes show it done
        const round = idleMotion > 0 ? (t * 0.3) % 1.3 : 1.3;
        lines.current.forEach((line, i) => {
            if (!line) {
                return;
            }
            const shown = Math.min(Math.max(round * 4 - i, 0.001), 1);
            line.scale.x = shown;
            line.position.x = LINE_LEFT + LINES[i].indent + (LINES[i].width * shown) / 2;
        });
        const lit = Math.min(Math.floor(Math.max(round * 4 - 3, 0) * 6), 4) + (lift > 0.5 ? 1 : 0);
        stars.current.forEach((star, i) => {
            if (star) {
                star.material = i < lit ? starOn : starOff;
                star.rotation.y = t * 1.5 + i;
            }
        });
    });

    const smoothness = lowPower ? 2 : 4;

    return (
        <group rotation={[0.1, 0, 0]} position={[0, 0.05, 0]}>
            <group ref={sway}>
                <RoundedBox args={[1.2, 0.62, 0.16]} radius={0.12} smoothness={smoothness} position={[-0.7, 0.42, 0]}>
                    <meshStandardMaterial color={colors.question} metalness={0.2} roughness={0.45} />
                </RoundedBox>
                <mesh position={[-1.08, 0.12, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.16, 0.16, 0.14]} />
                    <meshStandardMaterial color={colors.question} metalness={0.2} roughness={0.45} />
                </mesh>
                {[-0.95, -0.7, -0.45].map((x, i) => (
                    <mesh
                        key={x}
                        ref={(dot) => {
                            dots.current[i] = dot;
                        }}
                        position={[x, 0.42, 0.1]}
                    >
                        <sphereGeometry args={[0.065, 14, 10]} />
                        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.3} />
                    </mesh>
                ))}

                <RoundedBox
                    args={[1.5, 0.78, 0.16]}
                    radius={0.12}
                    smoothness={smoothness}
                    position={[ANSWER_X, ANSWER_Y, 0.15]}
                >
                    <meshStandardMaterial color={colors.answer} metalness={0.2} roughness={0.45} />
                </RoundedBox>
                <mesh position={[ANSWER_X + 0.5, ANSWER_Y - 0.36, 0.15]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.16, 0.16, 0.14]} />
                    <meshStandardMaterial color={colors.answer} metalness={0.2} roughness={0.45} />
                </mesh>
                {LINES.map(({ width, indent }, i) => (
                    <mesh
                        key={i}
                        ref={(line) => {
                            lines.current[i] = line;
                        }}
                        position={[LINE_LEFT + indent + width / 2, ANSWER_Y + 0.2 - i * 0.2, 0.25]}
                    >
                        <boxGeometry args={[width, 0.07, 0.02]} />
                        <meshStandardMaterial color={colors.lines[i]} emissive={colors.lines[i]} emissiveIntensity={0.5} />
                    </mesh>
                ))}

                {Array.from({ length: STARS }, (_, i) => (
                    <mesh
                        key={i}
                        ref={(star) => {
                            stars.current[i] = star;
                        }}
                        position={[ANSWER_X - 0.44 + i * 0.22, ANSWER_Y - 0.62, 0.15]}
                        material={i < 4 ? starOn : starOff}
                    >
                        <octahedronGeometry args={[0.075]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default Bubbles;
