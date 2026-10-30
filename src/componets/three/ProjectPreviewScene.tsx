import type { ComponentType } from 'react';
import SceneView from './SceneView';
import Ambulance from './previews/Ambulance';
import Bubbles from './previews/Bubbles';
import CityTiles from './previews/CityTiles';
import FilmChart from './previews/FilmChart';
import Hemicycle from './previews/Hemicycle';
import Hotel from './previews/Hotel';
import Network from './previews/Network';
import Padlock from './previews/Padlock';
import Parcel from './previews/Parcel';
import type { PreviewProps } from './previews/types';

// One preview per project, by the name of its repository (homeText.ts)
const PREVIEWS: Record<string, ComponentType<PreviewProps>> = {
    'connect-nine': Network,
    'smart-city-sim': CityTiles,
    'movie-success-prediction': FilmChart,
    'dutch-elections-platform': Hemicycle,
    'lucastars-game-webshop': Parcel,
    'lucastars-escape-room-game': Padlock,
    'code-exchange': Bubbles,
    'laravel-hotel_ter_duin_project': Hotel,
    'Rode_kruis-_APP': Ambulance,
};

function ProjectPreviewScene({ inView, project, active }: PreviewProps & { inView: boolean; project: string }) {
    const Preview = PREVIEWS[project] ?? Network;
    return (
        <SceneView inView={inView} camera={{ position: [0, 0.3, 5], fov: 35 }}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[2, 4, 5]} intensity={2.4} />
            <pointLight position={[-3, -1, 2]} intensity={10} color="#22d3ee" />
            <Preview active={active} />
        </SceneView>
    );
}

export default ProjectPreviewScene;
