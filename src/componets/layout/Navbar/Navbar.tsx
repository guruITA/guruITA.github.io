import { useState } from 'react';
import styles from './Navbar.module.scss';

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <a className={styles.logo} href="#home">
                    Gurpreet Singh
                </a>

                <button
                    className={styles.menuButton}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? '✕' : '☰'}
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
                        <a href="#skills" onClick={() => setMenuOpen(false)}>
                            Skills
                        </a>
                    </li>

                    <li>
                        <a href="#projects" onClick={() => setMenuOpen(false)}>
                            Projects
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