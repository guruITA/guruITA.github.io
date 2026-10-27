import './App.scss';

import { lazy, Suspense } from 'react';

import Navbar from './componets/layout/Navbar/Navbar';
import Footer from './componets/layout/Footer/Footer';
import Home from './componets/sections/Home/Home';
import ShaderBackground from './componets/background/ShaderBackground/ShaderBackground';
import SceneHost from './componets/three/SceneHost';

// fps and quality readout for testing on real devices; only downloaded with ?perf in the URL
const showPerf = new URLSearchParams(window.location.search).has('perf');
const PerfOverlay = lazy(() => import('./componets/background/PerfOverlay/PerfOverlay'));

function App() {
    return (
        <>
            <ShaderBackground />
            <Navbar />

            <main>
                <Home />
            </main>
            <Footer />
            <SceneHost />
            {showPerf && (
                <Suspense fallback={null}>
                    <PerfOverlay />
                </Suspense>
            )}
        </>
    );
}

export default App;
