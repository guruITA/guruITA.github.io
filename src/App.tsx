import './App.scss';

import Navbar from './componets/layout/Navbar/Navbar';
import Home from './componets/sections/Home/Home';
import ShaderBackground from './componets/background/ShaderBackground/ShaderBackground';

function App() {
    return (
        <>
            <ShaderBackground />
            <Navbar />

            <main>
                <Home />
            </main>
        </>
    );
}

export default App;
