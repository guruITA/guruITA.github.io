import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import photo from '../assets/cv-photo.webp';
import Footer from '../componets/layout/Footer/Footer';
import Navbar from '../componets/layout/Navbar/Navbar';
import { cv, type CvEntry } from './cvData';
import styles from './CvPage.module.scss';

// written next to the page by scripts/build-cv-pdf.mjs during `npm run build`
const PDF_HREF = '/cv/gurpreet-singh-cv.pdf';
const PDF_NAME = 'Gurpreet-Singh-CV.pdf';

// How long the button says the CV was downloaded and ignores clicks: browsers take a moment
// before they show a started download, and visitors who see nothing happen click again
const DONE_MS = 4000;

type DownloadState = 'idle' | 'busy' | 'done';

// A plain download link shows nothing until the browser shows the file, so visitors click again and get it
// twice. This fetches the PDF once, says so while it does and after it is saved, and ignores clicks in
// between; if fetching fails it falls back to the plain link.
function DownloadButton() {
    const [state, setState] = useState<DownloadState>('idle');
    const resetTimer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(resetTimer.current), []);

    const download = async (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (state !== 'idle') {
            return;
        }
        setState('busy');
        try {
            const response = await fetch(PDF_HREF);
            // an HTML page here means there is no PDF (it would be saved as a broken .pdf)
            if (!response.ok || !response.headers.get('content-type')?.includes('pdf')) {
                throw new Error(`no PDF at ${PDF_HREF}`);
            }
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement('a');
            link.href = url;
            link.download = PDF_NAME;
            link.click();
            // some browsers read the file after click() returns
            window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch {
            window.location.href = PDF_HREF;
        }
        setState('done');
        resetTimer.current = window.setTimeout(() => setState('idle'), DONE_MS);
    };

    const label = { idle: 'Download PDF', busy: 'Preparing PDF…', done: 'Downloaded ✓' }[state];

    return (
        <a
            className={styles.download}
            href={PDF_HREF}
            download={PDF_NAME}
            onClick={download}
            aria-busy={state === 'busy'}
            aria-disabled={state !== 'idle'}
        >
            {label}
        </a>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className={styles.section}>
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
    return (
        <>
            <Navbar />
            <div className={styles.page}>
                {/* screen only: the PDF is just the sheet. The download sits at the top on purpose:
                    not every visitor reads down to the end of the CV */}
                <div className={styles.toolbar}>
                    <DownloadButton />
                </div>

                <main className={styles.sheet}>
                    <header className={styles.header}>
                        <div className={styles.identity}>
                            <img className={styles.photo} src={photo} alt={`Photo of ${cv.name}`} width="320" height="320" />
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

                    <p className={styles.summary}>{cv.summary}</p>

                    <div className={styles.columns}>
                        <div className={styles.mainColumn}>
                            <Section title="Education">
                                <Entries entries={cv.education} />
                            </Section>
                            <Section title="Internships">
                                <Entries entries={cv.internships} />
                            </Section>
                            <Section title="Work experience">
                                <Entries entries={cv.experience} />
                            </Section>
                        </div>

                        <aside className={styles.sideColumn}>
                            <Section title="Personal details">
                                <dl className={styles.facts}>
                                    {cv.personal.map((fact) => (
                                        <div key={fact.label}>
                                            <dt>{fact.label}</dt>
                                            <dd>{fact.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </Section>
                            <Section title="Skills">
                                {cv.skills.map((skill) => (
                                    <div key={skill.group} className={styles.skillGroup}>
                                        <h3>{skill.group}</h3>
                                        <Tags items={skill.items} />
                                    </div>
                                ))}
                            </Section>
                            <Section title="Spoken languages">
                                <Tags items={cv.languages} />
                            </Section>
                            <Section title="Interests">
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
