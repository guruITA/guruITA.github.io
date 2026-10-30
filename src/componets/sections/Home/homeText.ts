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
    location: 'Volendam, the Netherlands',
    availability: 'Looking for a graduation internship',
    greeting: "Hi, I'm Gurpreet.",
    tagline: 'I build the parts that have to keep working: logins, payments and deploys.',
    intro: 'Fourth-year Software Engineering student at the HvA. For me a feature is done when it is tested, written down and running on a server.',
    viewProjects: 'View projects',
    contactMe: 'Contact me',
    about: {
        eyebrow: 'About me',
        title: 'From car engines to code',
        description:
            'I started as an automotive technician and switched to software in 2020. Next to my studies I run my own taxi business. Both taught me that people count on things working.',
        panelTitle: 'How I work',
        principles: [
            'One issue, one branch, one merge request, reviewed by a teammate',
            'I write down how things work, so a new teammate can start without asking',
            'Done means tested, also in the browser and on the test site',
        ],
        viewCv: 'View CV',
    },
    projectsHeading: {
        eyebrow: 'Projects',
        title: 'What I built, mostly in a team',
        description: 'Every repository says what the project does, how to run it and who did what.',
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
    viewOnGithubOf: (project: string) => `View on GitHub: ${project} (opens in a new tab)`,
    projectsLabel: 'Projects',
    skillsLabel: 'Skills',
    showCard: (index: number, count: number) => `Show ${index + 1} of ${count}`,
    projectsControls: { previous: 'Previous projects', next: 'Next projects' },
    skillsControls: { previous: 'Previous skill', next: 'Next skill' },
    skillsHeading: {
        eyebrow: 'Skills',
        // the middle part never breaks, so it does not split over two lines
        title: { before: 'What I ', noWrap: 'work with', after: '' },
        description:
            'Most of my work is back end. I also build the screens on top of it and the pipeline that ships it.',
    },
    skills: [
        { index: 'A', title: 'Frontend', description: 'Vue, Lit and React with TypeScript, styled with SCSS.' },
        { index: 'B', title: 'Backend', description: 'Spring Boot, Laravel, Express and AWS Lambda, on MySQL.' },
        { index: 'C', title: 'Engineering', description: 'Reviews, unit and browser tests, and deploys in CI.' },
        { index: 'D', title: 'Hardware & 3D', description: 'ESP32 boards with sensors in C++, and Three.js.' },
    ],
    contact: {
        eyebrow: 'Contact',
        title: 'Have an internship or a project for me?',
        description: 'Send me a message. A question about one of my projects is welcome too.',
    },
};

const nl: typeof en = {
    portraitAlt: 'Getekend portret van Gurpreet Singh',
    role: 'Full-stack developer',
    location: 'Volendam, Nederland',
    availability: 'Op zoek naar een afstudeerstage',
    greeting: 'Hoi, ik ben Gurpreet.',
    tagline: 'Ik bouw de delen die moeten blijven werken: inloggen, betalen en deployen.',
    intro: 'Vierdejaars student Software Engineering aan de HvA. Voor mij is een feature af als hij getest is, beschreven is en op een server draait.',
    viewProjects: 'Bekijk projecten',
    contactMe: 'Neem contact op',
    about: {
        eyebrow: 'Over mij',
        title: 'Van automotoren naar code',
        description:
            'Ik was eerst autotechnicus en koos in 2020 voor software. Naast mijn studie heb ik een eigen taxibedrijf. Allebei leerden me dat mensen rekenen op iets dat werkt.',
        panelTitle: 'Hoe ik werk',
        principles: [
            'Eén issue, één branch, één merge request, met een review',
            'Ik schrijf op hoe iets werkt, zodat een nieuwe teamgenoot zo kan beginnen',
            'Af is getest, ook in de browser en op de testsite',
        ],
        viewCv: 'Bekijk CV',
    },
    projectsHeading: {
        eyebrow: 'Projecten',
        title: 'Wat ik bouwde, meestal in een team',
        description: 'Elke repository vertelt wat het project doet, hoe je het draait en wie wat deed.',
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
    viewOnGithubOf: (project: string) => `Bekijk op GitHub: ${project} (opent in een nieuw tabblad)`,
    projectsLabel: 'Projecten',
    skillsLabel: 'Vaardigheden',
    showCard: (index: number, count: number) => `Toon ${index + 1} van ${count}`,
    projectsControls: { previous: 'Vorige projecten', next: 'Volgende projecten' },
    skillsControls: { previous: 'Vorige vaardigheid', next: 'Volgende vaardigheid' },
    skillsHeading: {
        eyebrow: 'Vaardigheden',
        title: { before: 'Waar ik ', noWrap: 'mee werk', after: '' },
        description:
            'Het meeste werk zit in de backend. Ik bouw ook de schermen erop en de pipeline die het uitrolt.',
    },
    skills: [
        { index: 'A', title: 'Frontend', description: 'Vue, Lit en React met TypeScript, gestyled met SCSS.' },
        { index: 'B', title: 'Backend', description: 'Spring Boot, Laravel, Express en AWS Lambda, op MySQL.' },
        { index: 'C', title: 'Engineering', description: 'Reviews, unit- en browsertests, en deploys in CI.' },
        { index: 'D', title: 'Hardware & 3D', description: 'ESP32-bordjes met sensoren in C++, en Three.js.' },
    ],
    contact: {
        eyebrow: 'Contact',
        title: 'Heb je een stage of project voor mij?',
        description: 'Stuur me een bericht. Een vraag over een van mijn projecten mag ook.',
    },
};

export const homeText: Texts<typeof en> = { en, nl };

export type Skill = (typeof en.skills)[number];
