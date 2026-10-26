import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { approach } from './sceneQuality';

// 0 at rest, eases to 1 while `active` (hover or focus); scenes scale their reaction with it
export function useActiveLevel(active: boolean, lambda = 5) {
    const level = useRef(0);
    const invalidate = useThree((state) => state.invalidate);

    // without idle frames (reduced motion) the new state still needs one render
    useEffect(() => invalidate(), [active, invalidate]);

    useFrame((_, delta) => {
        level.current = approach(level.current, active ? 1 : 0, lambda, delta);
    });

    return level;
}
