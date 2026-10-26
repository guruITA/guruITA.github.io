import type { ReactNode } from 'react';
import photo from '../assets/cv-photo.webp';
import Footer from '../componets/layout/Footer/Footer';
import Navbar from '../componets/layout/Navbar/Navbar';
import { cv, type CvEntry } from './cvData';
import styles from './CvPage.module.scss';

// written next to the page by scripts/build-cv-pdf.mjs during `npm run build`
const PDF_HREF = '/cv/gurpreet-singh-cv.pdf';

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
                    <a className={styles.download} href={PDF_HREF} download="Gurpreet-Singh-CV.pdf">
                        Download PDF
                    </a>
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
