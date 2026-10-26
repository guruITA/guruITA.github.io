import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { isLowPowerDevice } from '../deviceProfile';
import { createFrameLimiter } from '../frameLimiter';
import styles from './WorldBackground.module.scss';

type GradientStop = {
    t: number;
    color: THREE.Color;
};

type CameraKeyframe = {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
};

type Disposable = THREE.BufferGeometry | THREE.Material | THREE.Texture;

const CAMERA_KEYFRAMES: CameraKeyframe[] = [
    { position: new THREE.Vector3(0, 10, 18), lookAt: new THREE.Vector3(0, 3, 2) },
    { position: new THREE.Vector3(0, 5.5, 6), lookAt: new THREE.Vector3(0, 5, -6) },
    { position: new THREE.Vector3(-5, 3, -8), lookAt: new THREE.Vector3(2, 2, -16) },
    { position: new THREE.Vector3(0, 1.6, -26), lookAt: new THREE.Vector3(0, 1, -34) },
    { position: new THREE.Vector3(0, 4, -36), lookAt: new THREE.Vector3(0, 9, -42) },
];

function readCssColor(name: string, fallback: string) {
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return value || fallback;
}

function sampleGradient(stops: GradientStop[], t: number, out: THREE.Color) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    for (let i = 0; i < stops.length - 1; i += 1) {
        const a = stops[i];
        const b = stops[i + 1];
        if (clamped >= a.t && clamped <= b.t) {
            const span = b.t - a.t || 1;
            return out.copy(a.color).lerp(b.color, (clamped - a.t) / span);
        }
    }
    return out.copy(stops[stops.length - 1].color);
}

function randomRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function createCanvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        paint(ctx);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createWindowTexture(cols: number, rows: number) {
    const cell = 16;
    return createCanvasTexture(cols * cell, rows * cell, (ctx) => {
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, cols * cell, rows * cell);
        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                const lit = Math.random() < 0.4;
                const brightness = lit ? randomRange(0.55, 1) : randomRange(0, 0.05);
                ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                ctx.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6);
            }
        }
    });
}

function createPanelTexture(accentHex: number) {
    const accent = new THREE.Color(accentHex);
    const accentCss = `rgb(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)})`;
    const texture = createCanvasTexture(64, 256, (ctx) => {
        ctx.fillStyle = '#10121c';
        ctx.fillRect(0, 0, 64, 256);
        for (let i = 0; i < 50; i += 1) {
            ctx.fillStyle = `rgba(255,255,255,${randomRange(0.02, 0.08)})`;
            ctx.fillRect(Math.random() * 64, 0, 1, 256);
        }
        ctx.strokeStyle = accentCss;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        for (let y = 22; y < 256; y += 42) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(64, y);
            ctx.stroke();
        }
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createCircuitTexture(accentHex: number) {
    const accent = new THREE.Color(accentHex);
    const accentCss = `rgb(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)})`;
    const texture = createCanvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = accentCss;
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i += 1) {
            ctx.globalAlpha = randomRange(0.25, 0.5);
            const y = (i / 12) * 256 + randomRange(-6, 6);
            const bend = 60 + randomRange(-10, 10);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(bend, y);
            ctx.lineTo(bend + 24, y + 24);
            ctx.lineTo(256, y + 24);
            ctx.stroke();
        }
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = accentCss;
        for (let i = 0; i < 26; i += 1) {
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function addSectorAntennas(
    parent: THREE.Group,
    material: THREE.Material,
    heightY: number,
    radius: number,
    count: number,
    disposables: Disposable[],
) {
    const armGeometry = new THREE.BoxGeometry(0.4, 0.55, 0.08);
    disposables.push(armGeometry);
    for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const arm = new THREE.Mesh(armGeometry, material);
        arm.position.set(Math.cos(angle) * radius, heightY, Math.sin(angle) * radius);
        arm.rotation.y = -angle;
        arm.castShadow = true;
        parent.add(arm);
    }
}

function buildHeroSpires(color: THREE.Color, disposables: Disposable[]) {
    const group = new THREE.Group();

    const panelTexture = createPanelTexture(color.getHex());
    disposables.push(panelTexture);

    const spireGeometry = new THREE.CylinderGeometry(0.12, 0.32, 1, 8);
    const spireMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f1626,
        map: panelTexture,
        emissive: color,
        emissiveIntensity: 0.28,
        roughness: 0.6,
        metalness: 0.35,
    });
    disposables.push(spireGeometry, spireMaterial);

    const layout: [number, number, number][] = [
        [-2.9, 3.4, -1],
        [-1.4, 4.6, 1.1],
        [0.3, 3, -1.6],
        [1.7, 5.4, 0.4],
        [2.8, 3.8, -1.3],
        [-0.8, 4, 2],
    ];

    const armGeometry = new THREE.BoxGeometry(0.3, 0.07, 0.07);
    disposables.push(armGeometry);

    layout.forEach(([x, height, z]) => {
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.scale.set(1, height, 1);
        spire.position.set(x, height / 2, z);
        spire.rotation.z = randomRange(-0.04, 0.04);
        spire.rotation.x = randomRange(-0.04, 0.04);
        spire.castShadow = true;
        spire.receiveShadow = true;
        group.add(spire);

        const arm = new THREE.Mesh(armGeometry, spireMaterial);
        arm.position.set(x + 0.2, height - 0.3, z);
        arm.rotation.y = randomRange(0, Math.PI * 2);
        arm.castShadow = true;
        group.add(arm);
    });

    group.position.set(0, 0, -3);
    return { group };
}

function buildArchitectureHub(color: THREE.Color, disposables: Disposable[]) {
    const group = new THREE.Group();

    const coreGeometry = new THREE.IcosahedronGeometry(0.9, 1);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x101826,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.25,
        metalness: 0.5,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
    });
    disposables.push(coreGeometry, coreMaterial);

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.castShadow = true;
    group.add(core);

    const cage = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
    disposables.push(ringMaterial);
    [
        { radius: 1.7, tilt: Math.PI / 2.1, spin: 0 },
        { radius: 2.05, tilt: Math.PI / 2.6, spin: Math.PI / 3 },
        { radius: 2.35, tilt: Math.PI / 1.8, spin: -Math.PI / 4 },
    ].forEach(({ radius, tilt, spin }) => {
        const ringGeometry = new THREE.TorusGeometry(radius, 0.012, 8, 64);
        disposables.push(ringGeometry);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = tilt;
        ring.rotation.z = spin;
        cage.add(ring);
    });
    group.add(cage);

    group.position.set(0, 5.5, -6);
    return { group, core, cage };
}

function buildProjectDistricts(color: THREE.Color, disposables: Disposable[]) {
    const group = new THREE.Group();

    const sharedMaterial = new THREE.MeshStandardMaterial({
        color: 0x111827,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.55,
        metalness: 0.25,
    });
    disposables.push(sharedMaterial);

    const crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    disposables.push(crateGeometry);
    const commerceHub = new THREE.Group();
    const crateLayout: [number, number, number][] = [
        [-0.6, 0.5, -0.4],
        [0.5, 0.7, 0.3],
        [-0.3, 0.4, 0.8],
        [0.7, 0.9, -0.6],
        [0, 1.3, 0.1],
    ];
    crateLayout.forEach(([x, h, z]) => {
        const crate = new THREE.Mesh(crateGeometry, sharedMaterial);
        crate.scale.set(0.8 + randomRange(-0.08, 0.08), h, 0.8 + randomRange(-0.08, 0.08));
        crate.position.set(x + randomRange(-0.1, 0.1), h / 2, z + randomRange(-0.1, 0.1));
        crate.rotation.y = randomRange(-0.25, 0.25);
        crate.castShadow = true;
        crate.receiveShadow = true;
        commerceHub.add(crate);
    });
    commerceHub.position.set(-9, 0, -16);
    group.add(commerceHub);

    const windowTexture = createWindowTexture(4, 12);
    disposables.push(windowTexture);
    const towerGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    disposables.push(towerGeometry);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: 0x0c1322,
        emissive: color,
        emissiveIntensity: 0.9,
        emissiveMap: windowTexture,
        roughness: 0.7,
        metalness: 0.15,
    });
    disposables.push(towerMaterial);
    const cityGrid = new THREE.Group();
    for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
            const height = 1.4 + ((row * 3 + col) % 4) * 0.9 + randomRange(-0.15, 0.25);
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.scale.set(0.85 + randomRange(-0.1, 0.2), height, 0.85 + randomRange(-0.1, 0.2));
            tower.position.set(
                (col - 1) * 1.4 + randomRange(-0.2, 0.2),
                height / 2,
                (row - 1) * 1.4 + randomRange(-0.2, 0.2),
            );
            tower.rotation.y = randomRange(-0.1, 0.1);
            tower.castShadow = true;
            tower.receiveShadow = true;
            cityGrid.add(tower);
        }
    }
    cityGrid.position.set(0, 0, -16);
    group.add(cityGrid);

    const gemGeometry = new THREE.DodecahedronGeometry(1.15, 0);
    const gemMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x161322,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.08,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        transmission: 0.35,
        thickness: 1.2,
        ior: 1.5,
    });
    disposables.push(gemGeometry, gemMaterial);
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.set(9, 1.6, -16);
    gem.castShadow = true;
    group.add(gem);

    return { group, gem };
}

function buildCircuitPlane(color: THREE.Color, disposables: Disposable[]) {
    const group = new THREE.Group();

    const circuitTexture = createCircuitTexture(color.getHex());
    circuitTexture.repeat.set(2, 1.3);
    disposables.push(circuitTexture);
    const boardGeometry = new THREE.PlaneGeometry(9, 6);
    const boardMaterial = new THREE.MeshStandardMaterial({
        map: circuitTexture,
        roughness: 0.6,
        metalness: 0.3,
    });
    disposables.push(boardGeometry, boardMaterial);
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.rotation.x = -Math.PI / 2;
    board.position.y = 0.02;
    board.receiveShadow = true;
    group.add(board);

    const moduleGeometry = new THREE.BoxGeometry(0.4, 0.14, 0.4);
    disposables.push(moduleGeometry);

    const modules: { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; phase: number }[] = [];
    const columns = 6;
    const rows = 4;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
            const material = new THREE.MeshStandardMaterial({
                color: 0x0d1420,
                emissive: color,
                emissiveIntensity: 0.25,
                roughness: 0.5,
                metalness: 0.3,
            });
            disposables.push(material);

            const mesh = new THREE.Mesh(moduleGeometry, material);
            mesh.position.set(
                (col - (columns - 1) / 2) * 1.3 + randomRange(-0.08, 0.08),
                0.1,
                (row - (rows - 1) / 2) * 1.3 + randomRange(-0.08, 0.08),
            );
            mesh.rotation.y = randomRange(-0.06, 0.06);
            mesh.receiveShadow = true;
            group.add(mesh);
            modules.push({ mesh, material, phase: (row * columns + col) * 0.35 });
        }
    }

    group.position.set(0, 0, -34);
    return { group, modules };
}

function buildSignalTower(color: THREE.Color, disposables: Disposable[]) {
    const group = new THREE.Group();

    const panelTexture = createPanelTexture(color.getHex());
    panelTexture.repeat.set(1, 4);
    disposables.push(panelTexture);

    const towerGeometry = new THREE.CylinderGeometry(0.2, 1.1, 12, 10);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: 0x111324,
        map: panelTexture,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.4,
        metalness: 0.5,
    });
    disposables.push(towerGeometry, towerMaterial);

    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 6, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    addSectorAntennas(group, towerMaterial, 4, 0.82, 3, disposables);
    addSectorAntennas(group, towerMaterial, 7.2, 0.58, 3, disposables);
    addSectorAntennas(group, towerMaterial, 10, 0.37, 3, disposables);

    const antennaGeometry = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6);
    disposables.push(antennaGeometry);
    const antenna = new THREE.Mesh(antennaGeometry, towerMaterial);
    antenna.position.set(0, 13.1, 0);
    antenna.castShadow = true;
    group.add(antenna);

    const dishGeometry = new THREE.TorusGeometry(0.45, 0.05, 8, 16);
    disposables.push(dishGeometry);
    const dish = new THREE.Mesh(dishGeometry, towerMaterial);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 12.6, 0);
    group.add(dish);

    const smallDishGeometry = new THREE.TorusGeometry(0.26, 0.035, 8, 14);
    disposables.push(smallDishGeometry);
    const smallDish = new THREE.Mesh(smallDishGeometry, towerMaterial);
    smallDish.rotation.x = Math.PI / 3;
    smallDish.rotation.z = Math.PI / 5;
    smallDish.position.set(0.5, 9.4, 0.2);
    smallDish.castShadow = true;
    group.add(smallDish);

    const capGeometry = new THREE.SphereGeometry(0.45, 14, 14);
    const capMaterial = new THREE.MeshBasicMaterial({ color });
    disposables.push(capGeometry, capMaterial);
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(0, 12, 0);
    group.add(cap);

    const beaconGeometry = new THREE.SphereGeometry(0.1, 10, 10);
    disposables.push(beaconGeometry);
    const beaconMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: color,
        emissiveIntensity: 1,
    });
    disposables.push(beaconMaterial);
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(0, 14.3, 0);
    group.add(beacon);

    const sideBeacons = [
        { y: 7.5, phase: 1.1 },
        { y: 4, phase: 2.3 },
    ].map(({ y, phase }) => {
        const radiusAtHeight = THREE.MathUtils.lerp(1.1, 0.2, y / 12);
        const material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: color,
            emissiveIntensity: 1,
        });
        disposables.push(material);
        const mesh = new THREE.Mesh(beaconGeometry, material);
        mesh.position.set(radiusAtHeight + 0.08, y, 0);
        group.add(mesh);
        return { material, phase };
    });

    group.position.set(0, 0, -42);
    return { group, cap, beacon, beaconMaterial, sideBeacons };
}

function buildParticleField(disposables: Disposable[]) {
    const count = 260;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
        positions[i * 3] = randomRange(-16, 16);
        positions[i * 3 + 1] = randomRange(0.4, 12);
        positions[i * 3 + 2] = randomRange(6, -46);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xbfe0ff,
        size: 0.05,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    disposables.push(geometry, material);
    return new THREE.Points(geometry, material);
}

function WorldBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        // phones and weaker laptops skip antialiasing, shadows and bloom and render at 1x
        const lowPower = isLowPowerDevice();

        const gradientStops: GradientStop[] = [
            { t: 0, color: new THREE.Color(readCssColor('--color-blue', '#539bef')) },
            { t: 0.25, color: new THREE.Color(readCssColor('--color-mint', '#2dd4bf')) },
            { t: 0.5, color: new THREE.Color(readCssColor('--color-purple', '#a78bfa')) },
            { t: 0.75, color: new THREE.Color(readCssColor('--color-cyan', '#22d3ee')) },
            { t: 1, color: new THREE.Color(readCssColor('--color-violet', '#8b5cf6')) },
        ];

        const scene = new THREE.Scene();
        const baseColor = new THREE.Color(readCssColor('--color-dark-navy', '#070b14'));
        scene.fog = new THREE.Fog(baseColor.getHex(), 10, 46);

        const camera = new THREE.PerspectiveCamera(
            55,
            container.clientWidth / container.clientHeight,
            0.1,
            100,
        );

        const renderer = new THREE.WebGLRenderer({
            antialias: !lowPower,
            alpha: true,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.5));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = !lowPower;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        container.appendChild(renderer.domElement);

        const disposables: Disposable[] = [];

        const ambientLight = new THREE.AmbientLight(0x1b2436, 1.1);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xaecbff, 0.9);
        sunLight.position.set(14, 26, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.camera.left = -45;
        sunLight.shadow.camera.right = 45;
        sunLight.shadow.camera.top = 45;
        sunLight.shadow.camera.bottom = -45;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.bias = -0.0015;
        sunLight.target.position.set(0, 2, -20);
        scene.add(sunLight, sunLight.target);

        const landmarkLight = new THREE.PointLight(gradientStops[0].color, 6, 40, 2);
        scene.add(landmarkLight);

        const particles = buildParticleField(disposables);
        scene.add(particles);

        const hero = buildHeroSpires(gradientStops[0].color, disposables);
        const hub = buildArchitectureHub(gradientStops[1].color, disposables);
        const districts = buildProjectDistricts(gradientStops[2].color, disposables);
        const circuitPlane = buildCircuitPlane(gradientStops[3].color, disposables);
        const tower = buildSignalTower(gradientStops[4].color, disposables);

        scene.add(hero.group, hub.group, districts.group, circuitPlane.group, tower.group);

        const cameraCurve = new THREE.CatmullRomCurve3(
            CAMERA_KEYFRAMES.map((keyframe) => keyframe.position),
            false,
            'catmullrom',
            0.4,
        );
        const lookAtCurve = new THREE.CatmullRomCurve3(
            CAMERA_KEYFRAMES.map((keyframe) => keyframe.lookAt),
            false,
            'catmullrom',
            0.4,
        );

        const spinePoints = [
            new THREE.Vector3(0, 0.1, -3),
            new THREE.Vector3(0, 0.1, -6),
            new THREE.Vector3(0, 0.1, -16),
            new THREE.Vector3(0, 0.1, -34),
            new THREE.Vector3(0, 0.1, -42),
        ];
        const spineCurve = new THREE.CatmullRomCurve3(spinePoints, false, 'catmullrom', 0.4);

        const spineGeometry = new THREE.TubeGeometry(spineCurve, 80, 0.04, 6, false);
        const spineMaterial = new THREE.MeshBasicMaterial({
            color: gradientStops[0].color,
            transparent: true,
            opacity: 0.45,
        });
        disposables.push(spineGeometry, spineMaterial);
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        scene.add(spine);

        const pulseGeometry = new THREE.SphereGeometry(0.16, 10, 10);
        disposables.push(pulseGeometry);
        const pulses = [0, 0.5].map((phase) => {
            const material = new THREE.MeshBasicMaterial({ color: gradientStops[0].color });
            disposables.push(material);
            const mesh = new THREE.Mesh(pulseGeometry, material);
            scene.add(mesh);
            return { mesh, material, phase };
        });

        // bloom renders the scene several extra times, so low-power devices go without it
        let composer: EffectComposer | null = null;
        let bloomPass: UnrealBloomPass | null = null;
        if (!lowPower) {
            composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            bloomPass = new UnrealBloomPass(
                new THREE.Vector2(container.clientWidth, container.clientHeight),
                0.45,
                0.35,
                0.2,
            );
            composer.addPass(bloomPass);
        }

        const targetProgressRef = { current: 0 };
        let smoothedProgress = 0;
        const tmpColor = new THREE.Color();
        const tmpPosition = new THREE.Vector3();
        const tmpLookAt = new THREE.Vector3();
        const timer = new THREE.Timer();

        let animationFrameId = 0;
        let isVisible = true;

        const renderFrame = () => {
            sampleGradient(gradientStops, smoothedProgress, tmpColor);
            (scene.fog as THREE.Fog).color.copy(tmpColor).lerp(baseColor, 0.55);
            landmarkLight.color.copy(tmpColor);
            spineMaterial.color.copy(tmpColor);

            cameraCurve.getPoint(smoothedProgress, tmpPosition);
            lookAtCurve.getPoint(smoothedProgress, tmpLookAt);
            camera.position.copy(tmpPosition);
            camera.lookAt(tmpLookAt);
            landmarkLight.position.copy(tmpLookAt);

            if (composer) {
                composer.render();
            } else {
                renderer.render(scene, camera);
            }
        };

        // 120 and 144 Hz screens would otherwise render the scene twice as often
        const shouldRender = createFrameLimiter();
        const animate = (now = performance.now()) => {
            animationFrameId = requestAnimationFrame(animate);
            const idle = Math.abs(targetProgressRef.current - smoothedProgress) < 0.0005;
            if (!shouldRender(now, lowPower && idle ? 30 : 60)) {
                return;
            }

            timer.update();
            const delta = timer.getDelta();
            const elapsed = timer.getElapsed();

            smoothedProgress += (targetProgressRef.current - smoothedProgress) * 0.06;

            hub.core.rotation.y += delta * 0.15;
            hub.cage.rotation.y += delta * 0.08;
            hub.cage.rotation.x += delta * 0.04;
            districts.gem.rotation.y += delta * 0.2;

            tower.beaconMaterial.emissiveIntensity = 0.6 + Math.max(0, Math.sin(elapsed * 3)) * 1.4;
            tower.sideBeacons.forEach(({ material, phase }) => {
                material.emissiveIntensity = 0.5 + Math.max(0, Math.sin(elapsed * 2.4 + phase)) * 1.1;
            });

            circuitPlane.modules.forEach(({ material, phase }) => {
                material.emissiveIntensity = 0.22 + Math.max(0, Math.sin(elapsed * 1.4 + phase)) * 0.55;
            });

            pulses.forEach(({ mesh, material, phase }) => {
                const pulseT = (elapsed * 0.08 + phase) % 1;
                spineCurve.getPoint(pulseT, mesh.position);
                sampleGradient(gradientStops, pulseT, tmpColor);
                material.color.copy(tmpColor);
            });

            renderFrame();
        };

        const updateProgress = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            targetProgressRef.current =
                maxScroll > 0
                    ? THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1)
                    : 0;
        };

        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            composer?.setSize(width, height);

            if (prefersReducedMotion) {
                renderFrame();
            }
        };

        const handleVisibilityChange = () => {
            if (prefersReducedMotion) {
                return;
            }

            if (document.hidden && isVisible) {
                isVisible = false;
                cancelAnimationFrame(animationFrameId);
            } else if (!document.hidden && !isVisible) {
                isVisible = true;
                timer.update();
                animate();
            }
        };

        window.addEventListener('resize', handleResize);

        if (prefersReducedMotion) {
            smoothedProgress = 0.25;
            renderFrame();
        } else {
            updateProgress();
            smoothedProgress = targetProgressRef.current;
            window.addEventListener('scroll', updateProgress, { passive: true });
            document.addEventListener('visibilitychange', handleVisibilityChange);
            animate();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', updateProgress);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);

            disposables.forEach((disposable) => disposable.dispose());
            bloomPass?.dispose();
            composer?.dispose();
            renderer.dispose();

            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className={styles.background} aria-hidden="true" />;
}

export default WorldBackground;
