import './App.scss';
import Navbar from './componets/layout/Navbar/Navbar';
import Home from './componets/sections/Home/Home';

function App() {
    return (
        <>
            <Navbar />

            <main>
                <Home />
            </main>
        </>
    );
}

export default App;