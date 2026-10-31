import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import photo from '../assets/cv-photo.webp';
import Footer from '../componets/layout/Footer/Footer';
import Navbar from '../componets/layout/Navbar/Navbar';
import { useLanguage, useTexts } from '../i18n/language';
import { cv as cvTexts, type CvEntry } from './cvData';
import styles from './CvPage.module.scss';

// written next to the page by scripts/build-cv-pdf.mjs during `npm run build`, one per language
// (same paths as CV_PDF_PATHS in scripts/cv-pdf.mjs)
const PDF = {
    en: { href: '/cv/gurpreet-singh-cv.pdf', name: 'Gurpreet-Singh-CV.pdf' },
    nl: { href: '/cv/gurpreet-singh-cv-nl.pdf', name: 'Gurpreet-Singh-CV-NL.pdf' },
};

const text = {
    en: {
        download: { idle: 'Download CV (PDF)', busy: 'Preparing PDF…', done: 'Downloaded' },
        photoAlt: (name: string) => `Photo of ${name}`,
        profile: 'About me',
        education: 'Education',
        internships: 'Internships',
        experience: 'Work experience',
        personal: 'Personal details',
        skills: 'Skills',
        languages: 'Spoken languages',
        interests: 'Interests',
    },
    nl: {
        download: { idle: 'Download CV (PDF)', busy: 'PDF wordt klaargemaakt…', done: 'Gedownload' },
        photoAlt: (name: string) => `Foto van ${name}`,
        profile: 'Over mij',
        education: 'Opleiding',
        internships: 'Stages',
        experience: 'Werkervaring',
        personal: 'Persoonlijke gegevens',
        skills: 'Vaardigheden',
        languages: 'Talen',
        interests: 'Interesses',
    },
};

// How long the button says the CV was downloaded and ignores clicks: browsers take a moment
// before they show a started download, and visitors who see nothing happen click again
const DONE_MS = 4000;

type DownloadState = 'idle' | 'busy' | 'done';

// A plain download link shows nothing until the browser shows the file, so visitors click again and get it
// twice. This fetches the PDF once, says so while it does and after it is saved, and ignores clicks in
// between; if fetching fails it falls back to the plain link.
function DownloadButton() {
    const [state, setState] = useState<DownloadState>('idle');
    const { href, name } = PDF[useLanguage()];
    const t = useTexts(text);
    const resetTimer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(resetTimer.current), []);

    const download = async (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (state !== 'idle') {
            return;
        }
        setState('busy');
        try {
            const response = await fetch(href);
            // an HTML page here means there is no PDF (it would be saved as a broken .pdf)
            if (!response.ok || !response.headers.get('content-type')?.includes('pdf')) {
                throw new Error(`no PDF at ${href}`);
            }
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            link.click();
            // some browsers read the file after click() returns
            window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch {
            window.location.href = href;
        }
        setState('done');
        resetTimer.current = window.setTimeout(() => setState('idle'), DONE_MS);
    };

    const label = t.download[state];

    return (
        <a
            className={styles.download}
            href={href}
            download={name}
            onClick={download}
            aria-busy={state === 'busy'}
            aria-disabled={state !== 'idle'}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                {state === 'done' ? (
                    <path d="M20 6 9 17l-5-5" />
                ) : (
                    <>
                        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                        {/* the arrow moves on its own while the PDF is on its way */}
                        <path className={styles.downloadArrow} d="M12 3v12m-5-5 5 5 5-5" />
                    </>
                )}
            </svg>
            {label}
        </a>
    );
}

function Section({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
    return (
        <section className={className ? `${styles.section} ${className}` : styles.section}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function Entries({ entries }: { entries: CvEntry[] }) {
    return (
        <ol className={styles.entries}>
            {entries.map((entry) => (
                <li key={`${entry.title}-${entry.period}`} className={styles.entry}>
                    <div className={styles.entryHead}>
                        <h3>{entry.title}</h3>
                        <span className={styles.period}>{entry.period}</span>
                    </div>
                    <p className={styles.place}>{entry.place}</p>
                    {entry.points && entry.points.length > 0 && (
                        <ul>
                            {entry.points.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ol>
    );
}

function Tags({ items }: { items: string[] }) {
    return (
        <ul className={styles.tags}>
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

function CvPage() {
    const cv = useTexts(cvTexts);
    const t = useTexts(text);

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <main className={styles.sheet}>
                    {/* screen only: the PDF hides it. The download sits in the top corner on purpose:
                        not every visitor reads down to the end of the CV */}
                    <div className={styles.toolbar}>
                        <DownloadButton />
                    </div>

                    <header className={styles.header}>
                        <div className={styles.identity}>
                            <img className={styles.photo} src={photo} alt={t.photoAlt(cv.name)} width="320" height="320" />
                            <div>
                                <h1>{cv.name}</h1>
                                <p className={styles.role}>{cv.role}</p>
                                <p className={styles.location}>{cv.location}</p>
                            </div>
                        </div>
                        <dl className={styles.links}>
                            {cv.links.map((link) => (
                                <div key={link.href}>
                                    <dt>{link.label}</dt>
                                    <dd>
                                        <a href={link.href}>{link.value}</a>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </header>

                    <Section title={t.profile} className={styles.profile}>
                        <p className={styles.summary}>{cv.summary}</p>
                    </Section>

                    <div className={styles.columns}>
                        <div className={styles.mainColumn}>
                            <Section title={t.education}>
                                <Entries entries={cv.education} />
                            </Section>
                            <Section title={t.internships}>
                                <Entries entries={cv.internships} />
                            </Section>
                            <Section title={t.experience}>
                                <Entries entries={cv.experience} />
                            </Section>
                        </div>

                        <aside className={styles.sideColumn}>
                            <Section title={t.personal}>
                                <dl className={styles.facts}>
                                    {cv.personal.map((fact) => (
                                        <div key={fact.label}>
                                            <dt>{fact.label}</dt>
                                            <dd>{fact.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </Section>
                            <Section title={t.skills}>
                                {cv.skills.map((skill) => (
                                    <div key={skill.group} className={styles.skillGroup}>
                                        <h3>{skill.group}</h3>
                                        <Tags items={skill.items} />
                                    </div>
                                ))}
                            </Section>
                            <Section title={t.languages}>
                                <Tags items={cv.languages} />
                            </Section>
                            <Section title={t.interests}>
                                <Tags items={cv.interests} />
                            </Section>
                        </aside>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
}

export default CvPage;
