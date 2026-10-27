import { lazy, Suspense } from 'react';
import BackgroundErrorBoundary from '../background/BackgroundErrorBoundary';
import { useSceneLayerNeeded } from './sceneLayerStore';

// three.js and the shared canvas load only once the first section scene nears the screen
const SceneLayer = lazy(() => import('./SceneLayer'));

function SceneHost() {
    const needed = useSceneLayerNeeded();
    if (!needed) {
        return null;
    }
    return (
        <BackgroundErrorBoundary fallback={null}>
            <Suspense fallback={null}>
                <SceneLayer />
            </Suspense>
        </BackgroundErrorBoundary>
    );
}

export default SceneHost;
