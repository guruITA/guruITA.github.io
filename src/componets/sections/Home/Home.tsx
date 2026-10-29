import { lazy, useEffect, useState, type PointerEvent, type ReactNode } from 'react';
import profileImage from '../../../assets/profile.webp';
import ContactForm from '../../forms/ContactForm/ContactForm';
import SocialLinks from '../../layout/SocialLinks/SocialLinks';
import Carousel from '../../ui/Carousel/Carousel';
import SceneSlot from '../../three/SceneSlot';
import { useTexts } from '../../../i18n/language';
import styles from './Home.module.scss';
import { homeText, type Project, type Skill } from './homeText';

// three.js and the scenes load only when the first scene nears the screen
const HeroOrbScene = lazy(() => import('../../three/HeroOrbScene'));
const AboutRingsScene = lazy(() => import('../../three/AboutRingsScene'));
const ProjectPreviewScene = lazy(() => import('../../three/ProjectPreviewScene'));
const SkillIconScene = lazy(() => import('../../three/SkillIconScene'));

// Types the heading out letter by letter; the untyped rest stays in place invisibly, so the line never
// reflows, and screen readers get the whole text at once
function TypedHeading({ text }: { text: string }) {
    // with reduced motion the heading is simply there, fully typed
    const [reducedMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const [count, setCount] = useState(reducedMotion ? text.length : 0);

    useEffect(() => {
        if (reducedMotion) {
            return;
        }
        let index = 0;
        let timer: number;
        const typeNext = () => {
            index += 1;
            setCount(index);
            if (index < text.length) {
                // a little jitter so it feels typed by hand
                timer = window.setTimeout(typeNext, 65 + Math.random() * 55);
            }
        };
        timer = window.setTimeout(typeNext, 450);
        return () => window.clearTimeout(timer);
    }, [text, reducedMotion]);

    return (
        <h1 aria-label={text}>
            <span aria-hidden="true">{text.slice(0, count)}</span>
            <span
                aria-hidden="true"
                className={`${styles.caret} ${count >= text.length ? styles.caretDone : ''}`}
            />
            <span aria-hidden="true" className={styles.untyped}>
                {text.slice(count)}
            </span>
        </h1>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: ReactNode;
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

function ProjectCard({ project, index }: { project: Project; index: number }) {
    const [active, setActive] = useState(false);
    const t = useTexts(homeText);

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
            <ul aria-label={t.technologies(project.title)}>
                {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                ))}
            </ul>
            <SceneSlot className={styles.projectScene}>
                {(inView) => <ProjectPreviewScene inView={inView} variant={index} active={active} />}
            </SceneSlot>
            <a href="#contact" aria-label={t.viewCaseStudyOf(project.title)}>
                {t.viewCaseStudy} <span aria-hidden="true">→</span>
            </a>
        </article>
    );
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
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
    const t = useTexts(homeText);

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
                            alt={t.portraitAlt}
                        />
                        <span>
                            <strong>{t.role}</strong>
                            {t.location}
                            <span className={styles.availability}>
                                <span aria-hidden="true" /> {t.availability}
                            </span>
                        </span>
                    </div>

                    <div className={styles.heroContent}>
                        {/* keyed by the text, so switching language types the new greeting from the start */}
                        <TypedHeading key={t.greeting} text={t.greeting} />
                        <h2>{t.tagline}</h2>
                        <p className={styles.heroDescription}>{t.intro}</p>
                        <div className={styles.actions}>
                            <a className={styles.primaryAction} href="#projects">
                                {t.viewProjects}
                            </a>
                            <a className={styles.secondaryAction} href="#contact">
                                {t.contactMe}
                            </a>
                        </div>
                        <SocialLinks className={styles.heroSocials} />
                    </div>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.about}`}
                id="about"
                data-scene="about"
            >
                <div className={`${styles.container} ${styles.aboutGrid}`}>
                    <SectionHeading
                        eyebrow={t.about.eyebrow}
                        title={t.about.title}
                        description={t.about.description}
                    />

                    <div className={styles.glassPanel}>
                        <SceneSlot className={styles.aboutScene}>
                            {(inView) => <AboutRingsScene inView={inView} />}
                        </SceneSlot>
                        <p className={styles.panelIndex}>{t.about.panelTitle}</p>
                        <ul className={styles.principles}>
                            {t.about.principles.map((principle) => (
                                <li key={principle}>
                                    <span aria-hidden="true" />
                                    {principle}
                                </li>
                            ))}
                        </ul>
                        {/* the CV page shows the CV first; the PDF download sits on that page */}
                        <a className={styles.secondaryAction} href="/cv/">
                            {t.about.viewCv}
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
                        eyebrow={t.projectsHeading.eyebrow}
                        title={t.projectsHeading.title}
                        description={t.projectsHeading.description}
                    />

                    <Carousel className={styles.projectGrid} label={t.projectsLabel} dotLabel={t.showCard}>
                        {t.projects.map((project, index) => (
                            <ProjectCard project={project} index={index} key={project.title} />
                        ))}
                    </Carousel>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.skills}`}
                id="skills"
                data-scene="skills"
            >
                <div className={styles.container}>
                    <SectionHeading
                        eyebrow={t.skillsHeading.eyebrow}
                        title={
                            <>
                                {t.skillsHeading.title.before}
                                <span className={styles.noWrap}>{t.skillsHeading.title.noWrap}</span>
                                {t.skillsHeading.title.after}
                            </>
                        }
                        description={t.skillsHeading.description}
                    />

                    <Carousel className={styles.skillGrid} label={t.skillsLabel} dotLabel={t.showCard}>
                        {t.skills.map((skill, index) => (
                            <SkillCard skill={skill} index={index} key={skill.index} />
                        ))}
                    </Carousel>
                </div>
            </section>

            <section
                className={`${styles.section} ${styles.contact}`}
                id="contact"
                data-scene="contact"
            >
                <div className={styles.container}>
                    <div className={styles.contactPanel}>
                        <p className={styles.eyebrow}>{t.contact.eyebrow}</p>
                        <h2>{t.contact.title}</h2>
                        <p>{t.contact.description}</p>
                        <ContactForm />
                    </div>
                </div>
            </section>

        </div>
    );
}

export default Home;
