import { useEffect } from 'react';
import profileImage from '../../../assets/profile.webp';
import ContactForm from '../../forms/ContactForm/ContactForm';
import styles from './Home.module.scss';

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

function Home() {
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
                        <a
                            className={styles.secondaryAction}
                            href="/cv/gurpreet-singh-cv.pdf"
                            download
                        >
                            Download CV
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
                        {projects.map((project) => (
                            <article className={styles.projectCard} key={project.title}>
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
                                <a href="#contact">
                                    View case study <span aria-hidden="true">→</span>
                                </a>
                            </article>
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
                        {skills.map((skill) => (
                            <article className={styles.skillCard} key={skill.title}>
                                <span>{skill.index}</span>
                                <h3>{skill.title}</h3>
                                <p>{skill.description}</p>
                            </article>
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

            <footer className={styles.footer}>
                <div className={styles.container}>
                    <strong>guruITA · Gurpreet Singh</strong>
                    <span>Designed for clarity, built with curiosity.</span>
                    <ul className={styles.socialLinks} aria-label="Social links">
                        <li>
                            <a
                                href="https://instagram.com/guruITA"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://linkedin.com/in/guruITA"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                    <rect x="2" y="9" width="4" height="12" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://github.com/guruITA"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="GitHub"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>
            </footer>
        </div>
    );
}

export default Home;
