import { setLanguage, useLanguage, useTexts, type Language } from '../../../i18n/language';
import styles from './LanguageSwitch.module.scss';

const options: { language: Language; short: string; name: string }[] = [
    { language: 'en', short: 'EN', name: 'English' },
    { language: 'nl', short: 'NL', name: 'Nederlands' },
];

const text = {
    en: { label: 'Language' },
    nl: { label: 'Taal' },
};

// EN | NL in the navbar; the active language is highlighted
function LanguageSwitch() {
    const language = useLanguage();
    const t = useTexts(text);

    return (
        <div className={styles.switch} role="group" aria-label={t.label}>
            {options.map((option) => (
                <button
                    key={option.language}
                    type="button"
                    lang={option.language}
                    aria-label={option.name}
                    aria-pressed={language === option.language}
                    onClick={() => setLanguage(option.language)}
                >
                    {option.short}
                </button>
            ))}
        </div>
    );
}

export default LanguageSwitch;
