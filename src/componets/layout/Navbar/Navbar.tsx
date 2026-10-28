import { useState } from 'react';
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
        cv: 'CV',
        contact: 'Contact',
    },
    nl: {
        menu: 'Menu openen of sluiten',
        home: 'Home',
        about: 'Over mij',
        projects: 'Projecten',
        skills: 'Vaardigheden',
        cv: 'CV',
        contact: 'Contact',
    },
};

// Links start with / so they also lead to the portfolio sections from the CV page
function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const onCvPage = window.location.pathname.startsWith('/cv');
    const t = useTexts(text);

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <a className={styles.logo} href="/#home">
                    <img src={profileImage} alt="" />
                    <span>guruITA</span>
                </a>

                <ul
                    className={`${styles.navLinks} ${
                        menuOpen ? styles.open : ''
                    }`}
                >
                    <li>
                        <a href="/#home" onClick={() => setMenuOpen(false)}>
                            {t.home}
                        </a>
                    </li>

                    <li>
                        <a href="/#about" onClick={() => setMenuOpen(false)}>
                            {t.about}
                        </a>
                    </li>

                    <li>
                        <a href="/#projects" onClick={() => setMenuOpen(false)}>
                            {t.projects}
                        </a>
                    </li>

                    <li>
                        <a href="/#skills" onClick={() => setMenuOpen(false)}>
                            {t.skills}
                        </a>
                    </li>

                    <li>
                        <a
                            href="/cv/"
                            aria-current={onCvPage ? 'page' : undefined}
                            onClick={() => setMenuOpen(false)}
                        >
                            {t.cv}
                        </a>
                    </li>

                    <li>
                        <a href="/#contact" onClick={() => setMenuOpen(false)}>
                            {t.contact}
                        </a>
                    </li>
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