import { useTexts } from '../../../i18n/language';
import SocialLinks from '../SocialLinks/SocialLinks';
import styles from './Footer.module.scss';

const text = {
    en: {
        rights: 'All rights reserved.',
        tagline: 'Designed for clarity, built with curiosity.',
    },
    nl: {
        rights: 'Alle rechten voorbehouden.',
        tagline: 'Ontworpen voor helderheid, gebouwd met nieuwsgierigheid.',
    },
};

// Shared by the portfolio and the CV page
function Footer() {
    const t = useTexts(text);

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.brand}>
                    <strong>guruITA · Gurpreet Singh</strong>
                    {/* the year comes from the visitor's clock, so it never goes out of date */}
                    <small>© {new Date().getFullYear()} · {t.rights}</small>
                </div>
                <span>{t.tagline}</span>
                <SocialLinks />
            </div>
        </footer>
    );
}

export default Footer;
