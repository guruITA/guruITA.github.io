import type { Texts } from '../../../i18n/language';

export interface Project {
    number: string;
    title: string;
    description: string;
    tags: string[];
    // the name of the repository under github.com/guruITA
    repo: string;
    // only for work that is not finished yet
    status?: string;
}

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
            title: 'Connect',
            description: 'A platform that links young people in Amstelland with organisations.',
            tags: ['C#', 'TypeScript', 'Web'],
            repo: 'connect-nine',
            status: 'In progress with my team',
        },
        {
            number: '02',
            title: 'City Sim',
            description: 'A model smart city where ESP32 tiles send sensor data over WiFi to a live dashboard.',
            tags: ['C++', 'ESP32', 'IoT'],
            repo: 'smart-city-sim',
        },
        {
            number: '03',
            title: 'Movie Success Prediction',
            description: 'Analyses 81,000 IMDb movies and predicts how well a new film will do.',
            tags: ['Python', 'Dash', 'Machine learning'],
            repo: 'movie-success-prediction',
        },
        {
            number: '04',
            title: 'PolitiXplore',
            description: 'Results of the Dutch elections with parties, news, quizzes and a live chat.',
            tags: ['Java', 'Spring Boot', 'Vue'],
            repo: 'dutch-elections-platform',
        },
        {
            number: '05',
            title: 'Retro Game Store',
            description: 'A web shop for the LucaStars games with accounts, a cart and a checkout.',
            tags: ['TypeScript', 'Lit', 'Express'],
            repo: 'lucastars-game-webshop',
        },
        {
            number: '06',
            title: 'City of Shadows',
            description: 'A point-and-click detective game in the browser, set in a castle in 1932.',
            tags: ['TypeScript', 'Lit', 'Express'],
            repo: 'lucastars-escape-room-game',
        },
        {
            number: '07',
            title: 'Code Exchange',
            description: 'A Q&A site for HBO-ICT students in the style of Stack Overflow.',
            tags: ['TypeScript', 'Vite', 'MySQL'],
            repo: 'code-exchange',
        },
        {
            number: '08',
            title: 'Hotel ter Duin',
            description: 'A hotel website where guests book a room and staff manage the bookings.',
            tags: ['PHP', 'Laravel', 'MySQL'],
            repo: 'laravel-hotel_ter_duin_project',
        },
        {
            number: '09',
            title: 'Rode Kruis app',
            description: 'An Android app with vehicle check forms for the Dutch Red Cross.',
            tags: ['Kotlin', 'Android'],
            repo: 'Rode_kruis-_APP',
        },
    ] as Project[],
    technologies: (project: string) => `${project} technologies`,
    viewOnGithub: 'View on GitHub',
    viewOnGithubOf: (project: string) => `View ${project} on GitHub (opens in a new tab)`,
    projectsLabel: 'Projects',
    skillsLabel: 'Skills',
    showCard: (index: number, count: number) => `Show ${index + 1} of ${count}`,
    projectsControls: { previous: 'Previous projects', next: 'Next projects' },
    skillsControls: { previous: 'Previous skill', next: 'Next skill' },
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
            title: 'Connect',
            description: 'Een platform dat jongeren in Amstelland met organisaties verbindt.',
            tags: ['C#', 'TypeScript', 'Web'],
            repo: 'connect-nine',
            status: 'In ontwikkeling met mijn team',
        },
        {
            number: '02',
            title: 'City Sim',
            description: 'Een modelstad waarin ESP32-tegels sensordata naar een live dashboard sturen.',
            tags: ['C++', 'ESP32', 'IoT'],
            repo: 'smart-city-sim',
        },
        {
            number: '03',
            title: 'Movie Success Prediction',
            description: 'Analyseert 81.000 IMDb-films en voorspelt hoe goed een nieuwe film het doet.',
            tags: ['Python', 'Dash', 'Machine learning'],
            repo: 'movie-success-prediction',
        },
        {
            number: '04',
            title: 'PolitiXplore',
            description: 'Verkiezingsuitslagen met partijen, nieuws, quizzen en een live chat.',
            tags: ['Java', 'Spring Boot', 'Vue'],
            repo: 'dutch-elections-platform',
        },
        {
            number: '05',
            title: 'Retro Game Store',
            description: 'Een webshop voor LucaStars-games met accounts, winkelwagen en afrekenen.',
            tags: ['TypeScript', 'Lit', 'Express'],
            repo: 'lucastars-game-webshop',
        },
        {
            number: '06',
            title: 'City of Shadows',
            description: 'Een point-and-click detectivegame in de browser, in een kasteel in 1932.',
            tags: ['TypeScript', 'Lit', 'Express'],
            repo: 'lucastars-escape-room-game',
        },
        {
            number: '07',
            title: 'Code Exchange',
            description: 'Een Q&A-site voor HBO-ICT-studenten in de stijl van Stack Overflow.',
            tags: ['TypeScript', 'Vite', 'MySQL'],
            repo: 'code-exchange',
        },
        {
            number: '08',
            title: 'Hotel ter Duin',
            description: 'Een hotelsite waar gasten kamers boeken en personeel de boekingen beheert.',
            tags: ['PHP', 'Laravel', 'MySQL'],
            repo: 'laravel-hotel_ter_duin_project',
        },
        {
            number: '09',
            title: 'Rode Kruis-app',
            description: 'Een Android-app met controleformulieren voor voertuigen van het Rode Kruis.',
            tags: ['Kotlin', 'Android'],
            repo: 'Rode_kruis-_APP',
        },
    ],
    technologies: (project: string) => `Technieken van ${project}`,
    viewOnGithub: 'Bekijk op GitHub',
    viewOnGithubOf: (project: string) => `Bekijk ${project} op GitHub (opent in een nieuw tabblad)`,
    projectsLabel: 'Projecten',
    skillsLabel: 'Vaardigheden',
    showCard: (index: number, count: number) => `Toon ${index + 1} van ${count}`,
    projectsControls: { previous: 'Vorige projecten', next: 'Volgende projecten' },
    skillsControls: { previous: 'Vorige vaardigheid', next: 'Volgende vaardigheid' },
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

export type Skill = (typeof en.skills)[number];
