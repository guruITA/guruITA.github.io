import './App.scss';

import Navbar from './componets/layout/Navbar/Navbar';
import Home from './componets/sections/Home/Home';
import WorldBackground from './componets/background/WorldBackground/WorldBackground';

function App() {
    return (
        <>
            <WorldBackground />
            <Navbar />

            <main>
                <Home />
            </main>
        </>
    );
}

export default App;