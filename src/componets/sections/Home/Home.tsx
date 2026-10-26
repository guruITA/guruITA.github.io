import { lazy, useEffect, useState, type PointerEvent } from 'react';
import profileImage from '../../../assets/profile.webp';
import ContactForm from '../../forms/ContactForm/ContactForm';
import SceneSlot from '../../three/SceneSlot';
import styles from './Home.module.scss';

// three.js and the scenes load only when the first scene nears the screen
const HeroOrbScene = lazy(() => import('../../three/HeroOrbScene'));
const AboutRingsScene = lazy(() => import('../../three/AboutRingsScene'));
const ProjectPreviewScene = lazy(() => import('../../three/ProjectPreviewScene'));
const SkillIconScene = lazy(() => import('../../three/SkillIconScene'));

const valueProps = [
    {
        eyebrow: 'Product mindset',
        title: 'From idea to useful outcome',
    },
    {
        eyebrow: 'Full-stack',
        title: 'Frontend, backend and delivery',
    },
    {
        eyebrow: 'Always learning',
        title: 'Curious, reflective and improving',
    },
];

const projects = [
    {
        number: '01',
        title: 'Connect Nine',
        description:
            'A youth-focused digital platform shaped around opportunities and community.',
        tags: ['Product', 'Web'],
    },
    {
        number: '02',
        title: 'Nidar Store',
        description:
            'A full-stack commerce project exploring useful product flows and delivery.',
        tags: ['Full-stack', 'Commerce'],
    },
    {
        number: '03',
        title: 'Wireless AV',
        description:
            'A management concept for connected audiovisual environments.',
        tags: ['Systems', 'UX'],
    },
];

const skills = [
    {
        index: 'A',
        title: 'Frontend',
        description: 'React, TypeScript, responsive UI and interaction.',
    },
    {
        index: 'B',
        title: 'Backend',
        description: 'APIs, application logic, data and integrations.',
    },
    {
        index: 'C',
        title: 'Engineering',
        description: 'Git, testing, delivery and maintainable code.',
    },
    {
        index: 'D',
        title: '3D & exploration',
        description: 'Three.js, experiments and emerging technology.',
    },
];

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
        </header>
    );
}

// Touch also fires pointerenter (even when a scroll starts on a card), so only the mouse counts as hover
function onMouse(handler: () => void) {
    return (event: PointerEvent) => {
        if (event.pointerType === 'mouse') {
            handler();
        }
    };
}

function ProjectCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
    const [active, setActive] = useState(false);

    return (
        <article
            className={styles.projectCard}
            onPointerEnter={onMouse(() => setActive(true))}
            onPointerLeave={onMouse(() => setActive(false))}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
        >
            <div className={styles.projectTopline}>
                <span>{project.number}</span>
                <i aria-hidden="true" />
            </div>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <ul aria-label={`${project.title} technologies`}>
                {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                ))}
            </ul>
            <SceneSlot className={styles.projectScene}>
                {(inView) => <ProjectPreviewScene inView={inView} variant={index} active={active} />}
            </SceneSlot>
            <a href="#contact">
                View case study <span aria-hidden="true">→</span>
            </a>
        </article>
    );
}

function SkillCard({ skill, index }: { skill: (typeof skills)[number]; index: number }) {
    const [active, setActive] = useState(false);

    return (
        <article
            className={styles.skillCard}
            onPointerEnter={onMouse(() => setActive(true))}
            onPointerLeave={onMouse(() => setActive(false))}
        >
            <SceneSlot className={styles.skillIcon} fallback={<span>{skill.index}</span>}>
                {(inView) => <SkillIconScene inView={inView} variant={index} active={active} />}
            </SceneSlot>
            <h3>{skill.title}</h3>
            <p>{skill.description}</p>
        </article>
    );
}

function Home() {
    // Coming from another page (e.g. /cv/ -> /#projects), the browser looks for the section before React
    // has rendered it and stays at the top; jump to it once it exists, and again once the web fonts are in,
    // because they can still change the height of the sections above it
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) {
            return;
        }
        const jump = () => {
            const target = document.getElementById(id);
            if (!target) {
                return;
            }
            // offsetTop ignores transforms: sections start 32px lower for their reveal animation, and
            // scrollIntoView would aim at that spot and end up 32px off once they move into place
            let top = 0;
            for (let node: HTMLElement | null = target; node; node = node.offsetParent as HTMLElement | null) {
                top += node.offsetTop;
            }
            const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
            window.scrollTo({ top: top - margin, behavior: 'instant' });
        };
        jump();
        let cancelled = false;
        document.fonts.ready.then(() => {
            if (!cancelled) {
                jump();
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const sections = document.querySelectorAll<HTMLElement>('[data-scene]');
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReducedMotion) {
            sections.forEach((section) => section.classList.add(styles.revealed));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.revealed);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.portfolio}>
            <section
                className={`${styles.section} ${styles.hero}`}
                id="home"
                data-scene="home"
            >
                <div className={`${styles.container} ${styles.heroGrid}`}>
                    <div className={styles.profileVisual}>
                        <div className={styles.profileOrbit} aria-hidden="true" />
                        <SceneSlot className={styles.heroScene}>
                            {(inView) => <HeroOrbScene inView={inView} />}
                        </SceneSlot>
                        <img
                            src={profileImage}
                            alt="Illustrated portrait of Gurpreet Singh"
                        />
                        <span>
                            <strong>Full-stack developer</strong>
                            Based in the Netherlands
                        </span>
                    </div>

                    <div className={styles.heroContent}>
                        <p className={styles.availability}>
                            <span aria-hidden="true" /> Open to opportunities
                        </p>
                        <h1>Hi, I&apos;m Gurpreet.</h1>
                        <h2>
                            I build thoughtful digital products from
                            interface to infrastructure.
                        </h2>
                        <p className={styles.heroDescription}>
                            Software Engineering student and full-stack
                            developer focused on clear experiences,
                            maintainable systems and continuous learning.
                        </p>
                        <div className={styles.actions}>
                            <a className={styles.primaryAction} href="#projects">
                                View projects
                            </a>
                            <a className={styles.secondaryAction} href="#contact">
                                Contact me
                            </a>
                        </div>
                    </div>
                </div>

                <a className={styles.scrollCue} href="#about">
                    <span>Scroll to transform the scene</span>
                    <i aria-hidden="true" />
                </a>
            </section>

            <div className={styles.valueStrip}>
                {valueProps.map((value) => (
                    <div className={styles.valueItem} key={value.eyebrow}>
                        <p className={styles.eyebrow}>{value.eyebrow}</p>
                        <p>{value.title}</p>
                    </div>
                ))}
            </div>

            <section
                className={`${styles.section} ${styles.about}`}
                id="about"
                data-scene="about"
            >
                <div className={`${styles.container} ${styles.aboutGrid}`}>
                    <SectionHeading
                        eyebrow="About me"
                        title="Engineering with curiosity and care"
                        description="I enjoy turning complex requirements into understandable, reliable experiences — while continuously improving how I design, build and collaborate."
                    />

                    <div className={styles.glassPanel}>
                        <SceneSlot className={styles.aboutScene}>
                            {(inView) => <AboutRingsScene inView={inView} />}
                        </SceneSlot>
                        <p className={styles.panelIndex}>What I bring</p>
                        <ul className={styles.principles}>
                            <li>
                                <span aria-hidden="true" />
                                Clear thinking before writing code
                            </li>
                            <li>
                                <span aria-hidden="true" />
                                End-to-end ownership and pragmatic delivery
                            </li>
                            <li>
                                <span aria-hidden="true" />
                                A collaborative, feedback-driven approach
                            </li>
                        </ul>
                        {/* the CV page shows the CV first; the PDF download sits on that page */}
                        <a className={styles.secondaryAction} href="/cv/">
                            View CV
                        </a>
                    </div>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.projects}`}
                id="projects"
                data-scene="projects"
            >
                <div className={styles.container}>
                    <SectionHeading
                        eyebrow="Selected work"
                        title="Projects that connect code with real needs"
                        description="Product, platform and systems work ready to grow into deeper case studies."
                    />

                    <div className={styles.projectGrid}>
                        {projects.map((project, index) => (
                            <ProjectCard project={project} index={index} key={project.title} />
                        ))}
                    </div>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.skills}`}
                id="skills"
                data-scene="skills"
            >
                <div className={styles.container}>
                    <SectionHeading
                        eyebrow="Capabilities"
                        title="A balanced full-stack toolkit"
                        description="Tools change. Strong fundamentals, thoughtful architecture and the ability to learn remain central."
                    />

                    <div className={styles.skillGrid}>
                        {skills.map((skill, index) => (
                            <SkillCard skill={skill} index={index} key={skill.title} />
                        ))}
                    </div>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.contact}`}
                id="contact"
                data-scene="contact"
            >
                <div className={styles.container}>
                    <div className={styles.contactPanel}>
                        <p className={styles.eyebrow}>Let&apos;s build something useful</p>
                        <h2>Have a project, opportunity or idea?</h2>
                        <p>
                            I&apos;m always open to a good conversation about
                            software, collaboration and learning.
                        </p>
                        <ContactForm />
                    </div>
                </div>
            </section>

        </div>
    );
}

export default Home;
