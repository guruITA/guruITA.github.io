import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Navbar.module.scss';
import profileImage from '../../../assets/profile.webp';
import { useTexts } from '../../../i18n/language';
import LanguageSwitch from '../LanguageSwitch/LanguageSwitch';

const text = {
    en: {
        menu: 'Toggle navigation menu',
        home: 'Home',
        about: 'About',
        projects: 'Projects',
        skills: 'Skills',
        cv: 'My CV',
        contact: 'Contact',
    },
    nl: {
        menu: 'Menu openen of sluiten',
        home: 'Home',
        about: 'Over mij',
        projects: 'Projecten',
        skills: 'Vaardigheden',
        cv: 'Mijn CV',
        contact: 'Contact',
    },
};

const sections = ['home', 'about', 'projects', 'skills', 'contact'] as const;
type Section = (typeof sections)[number];

// The section you are reading: the last one whose top passed 40% of the screen.
// At the very bottom it is the last one, because Contact may be too short to get that far up.
function useActiveSection(enabled: boolean) {
    const [active, setActive] = useState<Section>('home');

    useEffect(() => {
        if (!enabled) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 2;
            let current: Section = 'home';
            for (const id of sections) {
                const section = document.getElementById(id);
                if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.4) {
                    current = id;
                }
            }
            setActive(atBottom ? 'contact' : current);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [enabled]);

    return enabled ? active : null;
}

type Line = { x: number; y: number; width: number };

// Links start with / so they also lead to the portfolio sections from the CV page
function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const onCvPage = window.location.pathname.startsWith('/cv');
    const t = useTexts(text);
    const active = useActiveSection(!onCvPage);
    const listRef = useRef<HTMLUListElement>(null);
    const [line, setLine] = useState<Line | null>(null);

    // one line that slides to the link of the current section; measured again when the
    // link widths change (other language, fonts loaded, menu opened, window resized)
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;

        const measure = () => {
            const link = list.querySelector<HTMLAnchorElement>('[aria-current="location"]');
            if (!link || !link.offsetWidth) {
                setLine(null);
                return;
            }
            setLine({
                x: link.offsetLeft,
                y: link.offsetTop + link.offsetHeight,
                width: link.offsetWidth,
            });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, [active, t, menuOpen]);

    const sectionLink = (id: Section, label: string) => (
        <li>
            <a
                href={`/#${id}`}
                aria-current={active === id ? 'location' : undefined}
                onClick={() => setMenuOpen(false)}
            >
                {label}
            </a>
        </li>
    );

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <a className={styles.logo} href="/#home">
                    <img src={profileImage} alt="" />
                    <span>guruITA</span>
                </a>

                <ul
                    ref={listRef}
                    className={`${styles.navLinks} ${
                        menuOpen ? styles.open : ''
                    }`}
                >
                    {sectionLink('home', t.home)}
                    {sectionLink('about', t.about)}
                    {sectionLink('projects', t.projects)}
                    {sectionLink('skills', t.skills)}
                    {sectionLink('contact', t.contact)}

                    {/* last, as the call to action at the end of the links */}
                    <li>
                        <a
                            className={styles.cvButton}
                            href="/cv/"
                            aria-current={onCvPage ? 'page' : undefined}
                            onClick={() => setMenuOpen(false)}
                        >
                            {t.cv}
                        </a>
                    </li>

                    {line && (
                        <li
                            className={styles.activeLine}
                            aria-hidden="true"
                            style={{
                                width: line.width,
                                transform: `translate(${line.x}px, ${line.y}px)`,
                            }}
                        />
                    )}
                </ul>

                {/* the switch stays in the bar on phones, next to the menu button */}
                <div className={styles.actions}>
                    <LanguageSwitch />
                    <button
                        type="button"
                        className={styles.menuButton}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={t.menu}
                        aria-expanded={menuOpen}
                    >
                        {/* SVG instead of the ☰ / ✕ characters, which every system draws with a different symbol font */}
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            {menuOpen ? (
                                <path d="M6 6l12 12M18 6L6 18" />
                            ) : (
                                <path d="M4 7h16M4 12h16M4 17h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
