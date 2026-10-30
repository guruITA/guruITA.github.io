// The one place the CV lives: the /cv/ page renders it and the build prints that page to the PDF.
// Public: e-mail, phone and personal details are on it at the owner's request; no street address.
// English and Dutch, like the rest of the site; the build prints a PDF of each.
import type { Texts } from '../i18n/language';

export interface CvEntry {
    title: string;
    place: string;
    period: string;
    points?: string[];
}

export interface CvLink {
    // shown before the value, e.g. "LinkedIn"
    label: string;
    value: string;
    href: string;
}

export interface CvData {
    name: string;
    role: string;
    location: string;
    summary: string;
    links: CvLink[];
    personal: { label: string; value: string }[];
    education: CvEntry[];
    internships: CvEntry[];
    experience: CvEntry[];
    skills: { group: string; items: string[] }[];
    languages: string[];
    interests: string[];
}

const en: CvData = {
    name: 'Gurpreet Singh',
    role: 'Software Engineering student · Back-end developer',
    location: 'Volendam, the Netherlands',
    summary:
        'Driven fourth-year Software Engineering student at the Amsterdam University of Applied Sciences (HvA), with a strong focus on back-end development and a passion for innovative solutions. I am looking for a graduation internship where I can add value, keep growing and possibly stay on to work after I graduate. I have hands-on experience building apps with real impact, such as a damage detection app for the Red Cross and the host payment system of the Domits booking platform. I have worked in teams during my internships and in school projects. At school we built projects for real clients, such as Goodoo and the Young Amstelland Awards, and a wireless audiovisual management system. That taught me to listen closely to what a client wants and, where needed, to advise with clear reasons on what could work better. I am an analytical problem solver who strives for efficiency and quality, and I enjoy learning and applying new technologies.',
    links: [
        { label: 'Email', value: 'hello@guruita.dev', href: 'mailto:hello@guruita.dev' },
        { label: 'Phone', value: '+31 6 86215941', href: 'tel:+31686215941' },
        { label: 'Portfolio', value: 'guruita.dev', href: 'https://guruita.dev' },
        {
            label: 'LinkedIn',
            value: 'linkedin.com/in/gurpreet-singh2002',
            href: 'https://linkedin.com/in/gurpreet-singh2002',
        },
        { label: 'GitHub', value: 'github.com/guruITA', href: 'https://github.com/guruITA' },
    ],
    personal: [
        { label: 'Date of birth', value: '14 August 2002' },
        { label: 'Place of birth', value: 'Mirano, Italy' },
        { label: 'Nationality', value: 'Italian' },
    ],
    education: [
        {
            title: 'Software Engineering (Bachelor, HBO)',
            place: 'Amsterdam University of Applied Sciences (HvA), Amsterdam',
            period: 'Sep 2023 - present',
        },
        {
            title: 'Software Developer (MBO level 4)',
            place: 'MBO College Zuidoost, Amsterdam',
            period: 'Aug 2020 - Jun 2023',
        },
        {
            title: 'Automotive Technician (MBO level 2)',
            place: 'MBO College Westpoort, Amsterdam',
            period: 'Sep 2018 - Sep 2020',
        },
        {
            title: 'Mobility and Transport',
            place: 'Montessori College Oost, Amsterdam',
            period: 'Aug 2014 - Jun 2018',
        },
    ],
    internships: [
        {
            title: 'Software Developer Intern',
            place: 'Domits (Financieelsysteem B.V.), Haarlem',
            period: 'Sep 2025 - Jan 2026',
            points: [
                'Built the host finance part of Domits, a holiday rental booking platform, with Stripe Connect: bank details, charges, the 110% payment split, scheduled payouts, a revenue overview and a finance FAQ.',
                'Wrote the back end for it on AWS Lambda and moved the host dashboard styling to SCSS.',
                'Set up how the team works on GitHub: onboarding and release docs, contributing guidelines, issue templates, CODEOWNERS and a security policy.',
            ],
        },
        {
            title: 'Software Developer Intern',
            place: 'ITalent-workspace, Amsterdam',
            period: 'Sep 2022 - Feb 2023',
            points: [
                'Built an Android app in Kotlin for the Red Cross vehicle logistics.',
                'Volunteers fill in a check form when they take or return a vehicle: accessories, licence plate, events and photos of damage, so every vehicle can be traced back to who used it.',
            ],
        },
        {
            title: 'Automotive Mechanic Intern',
            place: 'Carworx, Amsterdam',
            period: 'Aug 2019 - Jul 2020',
            points: ['Diagnosed faults and did maintenance and repairs on cars.'],
        },
    ],
    experience: [
        {
            title: 'Taxi Driver (self-employed)',
            place: 'Lucky Sardar Services, Volendam',
            period: 'Apr 2023 - present',
            points: ['Run my own taxi business: the rides, the planning, the customer contact and the bookkeeping.'],
        },
        {
            title: 'Delivery Driver',
            place: 'Indian Spices & Vibes, Amsterdam',
            period: 'Apr 2020 - Apr 2021',
            points: ['Took orders, packed meals, worked the till and delivered.'],
        },
        {
            title: 'Delivery Driver and Staff Member',
            place: 'Grillwok, Diemen',
            period: 'May 2016 - Jul 2019',
            points: ['Helped run the family business after school: cooking, phone orders, the till and deliveries.'],
        },
    ],
    skills: [
        { group: 'Languages', items: ['Java', 'TypeScript', 'C#', 'PHP', 'Python'] },
        { group: 'Back end', items: ['Spring Boot', 'Laravel', 'FastAPI', '.NET', 'Express'] },
        { group: 'Cloud & data', items: ['AWS Lambda', 'Stripe', 'MySQL', 'Docker'] },
        { group: 'Front end', items: ['React', 'Vue', 'Lit', 'SCSS', 'Three.js'] },
        { group: 'Mobile & hardware', items: ['Kotlin', 'Android', 'C', 'C++', 'ESP32', 'Raspberry Pi'] },
        { group: 'Personal', items: ['Hands-on', 'Patient', 'Helpful', 'Eager to learn', 'Scrum'] },
    ],
    languages: ['Dutch', 'English', 'Italian', 'Punjabi'],
    interests: ['Building AI agent harnesses', 'Basketball', 'Table tennis', 'Coding', 'Gaming', 'Going out with friends'],
};

const nl: CvData = {
    name: 'Gurpreet Singh',
    role: 'Software Engineering-student · Back-end developer',
    location: 'Volendam, Nederland',
    summary:
        'Gedreven vierdejaars student Software Engineering aan de Hogeschool van Amsterdam (HvA), met een sterke focus op back-end ontwikkeling en een passie voor innovatieve oplossingen. Ik zoek een afstudeerstage waar ik waarde toevoeg, verder groei en na mijn afstuderen mogelijk kan blijven werken. Ik heb praktische ervaring in het bouwen van apps die echte impact maken, zoals een schadedetectie-app voor het Rode Kruis en het betaalsysteem voor verhuurders van Domits. Ik heb in teams gewerkt tijdens mijn stages en in schoolprojecten. Op school bouwden we projecten voor echte klanten, zoals Goodoo en de Young Amstelland Awards, en een draadloos audiovisueel beheersysteem. Daardoor leerde ik goed te luisteren naar de wensen van een klant en waar nodig met onderbouwing te adviseren wat beter kan. Ik ben een analytische probleemoplosser die streeft naar efficiëntie en kwaliteit, en ik leer graag nieuwe technologieën en pas ze toe.',
    links: [
        { label: 'E-mail', value: 'hello@guruita.dev', href: 'mailto:hello@guruita.dev' },
        { label: 'Telefoon', value: '+31 6 86215941', href: 'tel:+31686215941' },
        { label: 'Portfolio', value: 'guruita.dev', href: 'https://guruita.dev' },
        {
            label: 'LinkedIn',
            value: 'linkedin.com/in/gurpreet-singh2002',
            href: 'https://linkedin.com/in/gurpreet-singh2002',
        },
        { label: 'GitHub', value: 'github.com/guruITA', href: 'https://github.com/guruITA' },
    ],
    personal: [
        { label: 'Geboortedatum', value: '14 augustus 2002' },
        { label: 'Geboorteplaats', value: 'Mirano, Italië' },
        { label: 'Nationaliteit', value: 'Italiaans' },
    ],
    education: [
        {
            title: 'Software Engineering (bachelor, hbo)',
            place: 'Hogeschool van Amsterdam (HvA), Amsterdam',
            period: 'sep 2023 - heden',
        },
        {
            title: 'Software Developer (mbo niveau 4)',
            place: 'MBO College Zuidoost, Amsterdam',
            period: 'aug 2020 - jun 2023',
        },
        {
            title: 'Autotechnicus (mbo niveau 2)',
            place: 'MBO College Westpoort, Amsterdam',
            period: 'sep 2018 - sep 2020',
        },
        {
            title: 'Mobiliteit en Transport',
            place: 'Montessori College Oost, Amsterdam',
            period: 'aug 2014 - jun 2018',
        },
    ],
    internships: [
        {
            title: 'Stagiair Software Developer',
            place: 'Domits (Financieelsysteem B.V.), Haarlem',
            period: 'sep 2025 - jan 2026',
            points: [
                'Bouwde het financiële deel voor verhuurders van Domits, een boekingsplatform voor vakantiewoningen, met Stripe Connect: bankgegevens, betalingen, de 110%-verdeling, ingeplande uitbetalingen, een omzetoverzicht en een financiële FAQ.',
                'Schreef de backend daarvoor op AWS Lambda en zette de styling van het verhuurdersdashboard om naar SCSS.',
                'Zette de werkwijze van het team op GitHub op: documentatie voor onboarding en releases, richtlijnen voor bijdragen, issue-templates, CODEOWNERS en een beveiligingsbeleid.',
            ],
        },
        {
            title: 'Stagiair Software Developer',
            place: 'ITalent-workspace, Amsterdam',
            period: 'sep 2022 - feb 2023',
            points: [
                'Bouwde een Android-app in Kotlin voor de voertuiglogistiek van het Rode Kruis.',
                'Vrijwilligers vullen een controleformulier in als ze een voertuig meenemen of terugbrengen: accessoires, kenteken, gebeurtenissen en foto’s van schade, zodat elk voertuig te herleiden is naar wie het gebruikte.',
            ],
        },
        {
            title: 'Stagiair Automonteur',
            place: 'Carworx, Amsterdam',
            period: 'aug 2019 - jul 2020',
            points: ['Stelde storingen vast en deed onderhoud en reparaties aan auto’s.'],
        },
    ],
    experience: [
        {
            title: 'Taxichauffeur (zzp)',
            place: 'Lucky Sardar Services, Volendam',
            period: 'apr 2023 - heden',
            points: ['Mijn eigen taxibedrijf: de ritten, de planning, het klantcontact en de boekhouding.'],
        },
        {
            title: 'Bezorger',
            place: 'Indian Spices & Vibes, Amsterdam',
            period: 'apr 2020 - apr 2021',
            points: ['Bestellingen aannemen, maaltijden inpakken, afrekenen aan de kassa en bezorgen.'],
        },
        {
            title: 'Bezorger en medewerker',
            place: 'Grillwok, Diemen',
            period: 'mei 2016 - jul 2019',
            points: ['Hielp na school mee in het familiebedrijf: koken, telefonische bestellingen, de kassa en bezorgen.'],
        },
    ],
    skills: [
        { group: 'Programmeertalen', items: ['Java', 'TypeScript', 'C#', 'PHP', 'Python'] },
        { group: 'Backend', items: ['Spring Boot', 'Laravel', 'FastAPI', '.NET', 'Express'] },
        { group: 'Cloud & data', items: ['AWS Lambda', 'Stripe', 'MySQL', 'Docker'] },
        { group: 'Frontend', items: ['React', 'Vue', 'Lit', 'SCSS', 'Three.js'] },
        { group: 'Mobiel & hardware', items: ['Kotlin', 'Android', 'C', 'C++', 'ESP32', 'Raspberry Pi'] },
        { group: 'Persoonlijk', items: ['Praktisch', 'Geduldig', 'Hulpvaardig', 'Leergierig', 'Scrum'] },
    ],
    languages: ['Nederlands', 'Engels', 'Italiaans', 'Punjabi'],
    interests: ['AI-agent harnesses bouwen', 'Basketbal', 'Tafeltennis', 'Programmeren', 'Gamen', 'Uitgaan met vrienden'],
};

export const cv: Texts<CvData> = { en, nl };
