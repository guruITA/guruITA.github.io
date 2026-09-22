import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './ThreeBackground.module.scss';

function ThreeBackground() {

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );

        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        container.appendChild(renderer.domElement);

        const geometry = new THREE.IcosahedronGeometry(1.5, 1);

        const material = new THREE.MeshBasicMaterial({
            color: 0x1e293b,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
        });

        const object = new THREE.Mesh(geometry, material);

        object.position.set(2.2, 0, -0.5);

        scene.add(object);

        let animationFrameId: number;

        const animate = () => {
            object.rotation.x += 0.002;
            object.rotation.y += 0.004;

            renderer.render(scene, camera);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);

            geometry.dispose();
            material.dispose();
            renderer.dispose();

            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={styles.background}
            aria-hidden="true"
        />
    );
}

export default ThreeBackground;