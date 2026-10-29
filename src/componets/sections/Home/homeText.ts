import type { Texts } from '../../../i18n/language';

// All text of the portfolio page, in English and Dutch
const en = {
    portraitAlt: 'Illustrated portrait of Gurpreet Singh',
    role: 'Full-stack developer',
    location: 'Based in the Netherlands',
    availability: 'Open to opportunities',
    greeting: "Hi, I'm Gurpreet.",
    tagline: 'I build thoughtful digital products from interface to infrastructure.',
    intro: 'Software Engineering student and full-stack developer focused on clear experiences, maintainable systems and continuous learning.',
    viewProjects: 'View projects',
    contactMe: 'Contact me',
    about: {
        eyebrow: 'About me',
        title: 'Engineering with curiosity and care',
        description:
            'I enjoy turning complex requirements into understandable, reliable experiences — while continuously improving how I design, build and collaborate.',
        panelTitle: 'What I bring',
        principles: [
            'Clear thinking before writing code',
            'End-to-end ownership and pragmatic delivery',
            'A collaborative, feedback-driven approach',
        ],
        viewCv: 'View CV',
    },
    projectsHeading: {
        eyebrow: 'Selected work',
        title: 'Projects that connect code with real needs',
        description: 'Product, platform and systems work ready to grow into deeper case studies.',
    },
    projects: [
        {
            number: '01',
            title: 'Connect Nine',
            description: 'A youth-focused digital platform shaped around opportunities and community.',
            tags: ['Product', 'Web'],
        },
        {
            number: '02',
            title: 'Nidar Store',
            description: 'A full-stack commerce project exploring useful product flows and delivery.',
            tags: ['Full-stack', 'Commerce'],
        },
        {
            number: '03',
            title: 'Wireless AV',
            description: 'A management concept for connected audiovisual environments.',
            tags: ['Systems', 'UX'],
        },
    ],
    technologies: (project: string) => `${project} technologies`,
    viewCaseStudy: 'View case study',
    viewCaseStudyOf: (project: string) => `View case study: ${project}`,
    projectsLabel: 'Projects',
    skillsLabel: 'Skills',
    showCard: (index: number, count: number) => `Show ${index + 1} of ${count}`,
    skillsHeading: {
        eyebrow: 'Capabilities',
        // the middle part never breaks, so "full-stack" does not split over two lines
        title: { before: 'A balanced ', noWrap: 'full-stack', after: ' toolkit' },
        description:
            'Tools change. Strong fundamentals, thoughtful architecture and the ability to learn remain central.',
    },
    skills: [
        { index: 'A', title: 'Frontend', description: 'React, TypeScript, responsive UI and interaction.' },
        { index: 'B', title: 'Backend', description: 'APIs, application logic, data and integrations.' },
        { index: 'C', title: 'Engineering', description: 'Git, testing, delivery and maintainable code.' },
        { index: 'D', title: '3D & exploration', description: 'Three.js, experiments and emerging technology.' },
    ],
    contact: {
        eyebrow: "Let's build something useful",
        title: 'Have a project, opportunity or idea?',
        description: "I'm always open to a good conversation about software, collaboration and learning.",
    },
};

const nl: typeof en = {
    portraitAlt: 'Getekend portret van Gurpreet Singh',
    role: 'Full-stack developer',
    location: 'Gevestigd in Nederland',
    availability: 'Open voor nieuwe kansen',
    greeting: 'Hoi, ik ben Gurpreet.',
    tagline: 'Ik bouw doordachte digitale producten, van interface tot infrastructuur.',
    intro: 'Software Engineering-student en full-stack developer, gericht op heldere ervaringen, onderhoudbare systemen en blijven leren.',
    viewProjects: 'Bekijk projecten',
    contactMe: 'Neem contact op',
    about: {
        eyebrow: 'Over mij',
        title: 'Software bouwen met nieuwsgierigheid en zorg',
        description:
            'Ik maak van ingewikkelde eisen begrijpelijke, betrouwbare toepassingen — en blijf verbeteren hoe ik ontwerp, bouw en samenwerk.',
        panelTitle: 'Wat ik meebreng',
        principles: [
            'Eerst helder nadenken, dan pas code schrijven',
            'Verantwoordelijkheid van begin tot eind en praktisch opleveren',
            'Samenwerken, met feedback als vast onderdeel',
        ],
        viewCv: 'Bekijk CV',
    },
    projectsHeading: {
        eyebrow: 'Uitgelicht werk',
        title: 'Projecten waarin code echte problemen oplost',
        description: 'Werk aan producten, platforms en systemen, dat kan uitgroeien tot uitgebreidere casestudy’s.',
    },
    projects: [
        {
            number: '01',
            title: 'Connect Nine',
            description: 'Een digitaal platform voor jongeren, rond kansen en community.',
            tags: ['Product', 'Web'],
        },
        {
            number: '02',
            title: 'Nidar Store',
            description: 'Een full-stack webshopproject over handige productflows en levering.',
            tags: ['Full-stack', 'Webshop'],
        },
        {
            number: '03',
            title: 'Wireless AV',
            description: 'Een beheerconcept voor verbonden audiovisuele omgevingen.',
            tags: ['Systemen', 'UX'],
        },
    ],
    technologies: (project: string) => `Technieken van ${project}`,
    viewCaseStudy: 'Bekijk casestudy',
    viewCaseStudyOf: (project: string) => `Bekijk casestudy: ${project}`,
    projectsLabel: 'Projecten',
    skillsLabel: 'Vaardigheden',
    showCard: (index: number, count: number) => `Toon ${index + 1} van ${count}`,
    skillsHeading: {
        eyebrow: 'Vaardigheden',
        title: { before: 'Een veelzijdige ', noWrap: 'full-stack', after: ' toolkit' },
        description:
            'Tools veranderen. Sterke basiskennis, doordachte architectuur en het vermogen om te blijven leren staan centraal.',
    },
    skills: [
        { index: 'A', title: 'Frontend', description: 'React, TypeScript, responsive UI en interactie.' },
        { index: 'B', title: 'Backend', description: 'API’s, applicatielogica, data en koppelingen.' },
        { index: 'C', title: 'Engineering', description: 'Git, testen, oplevering en onderhoudbare code.' },
        { index: 'D', title: '3D & experimenten', description: 'Three.js, experimenten en nieuwe technologie.' },
    ],
    contact: {
        eyebrow: 'Laten we iets nuttigs bouwen',
        title: 'Heb je een project, kans of idee?',
        description: 'Ik sta altijd open voor een goed gesprek over software, samenwerken en leren.',
    },
};

export const homeText: Texts<typeof en> = { en, nl };

export type Project = (typeof en.projects)[number];
export type Skill = (typeof en.skills)[number];
