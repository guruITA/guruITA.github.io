import { useState } from 'react';
import styles from './Navbar.module.scss';
import profileImage from '../../../assets/profile.webp';

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <a className={styles.logo} href="#home">
                    <img src={profileImage} alt="" />
                    <span>guruITA</span>
                </a>

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation menu"
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

                <ul
                    className={`${styles.navLinks} ${
                        menuOpen ? styles.open : ''
                    }`}
                >
                    <li>
                        <a href="#about" onClick={() => setMenuOpen(false)}>
                            About
                        </a>
                    </li>

                    <li>
                        <a href="#projects" onClick={() => setMenuOpen(false)}>
                            Projects
                        </a>
                    </li>

                    <li>
                        <a href="#skills" onClick={() => setMenuOpen(false)}>
                            Skills
                        </a>
                    </li>

                    <li>
                        <a href="#contact" onClick={() => setMenuOpen(false)}>
                            Contact
                        </a>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;