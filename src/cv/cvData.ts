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
        'Fourth-year Software Engineering student at the Amsterdam University of Applied Sciences (HvA), looking for a graduation internship. I mostly build back ends: logins, payments and the pipelines that put them online. At Domits I built the host payments with Stripe Connect on AWS Lambda. In team projects I usually take on authentication, tests and deployment, and I write the docs that let the next teammate start on their own. Before software I was an automotive technician, and next to my studies I run my own taxi business.',
    links: [
        { label: 'Email', value: 'hello@guruita.dev', href: 'mailto:hello@guruita.dev' },
        { label: 'Phone', value: '+31 6 86215941', href: 'tel:+31686215941' },
        { label: 'Website', value: 'guruita.dev', href: 'https://guruita.dev' },
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
            period: 'Sep 2023 – present',
        },
        {
            title: 'Software Developer (MBO level 4)',
            place: 'MBO College Zuidoost, Amsterdam',
            period: 'Aug 2020 – Jun 2023',
        },
        {
            title: 'Automotive Technician (MBO level 2)',
            place: 'MBO College Westpoort, Amsterdam',
            period: 'Sep 2018 – Sep 2020',
        },
        {
            title: 'Mobility and Transport',
            place: 'Montessori College Oost, Amsterdam',
            period: 'Aug 2014 – Jun 2018',
        },
    ],
    internships: [
        {
            title: 'Software Developer Intern',
            place: 'Domits (Financieelsysteem B.V.), Haarlem',
            period: 'Sep 2025 – Jan 2026',
            points: [
                'Built the host finance part of Domits, a holiday rental booking platform, with Stripe Connect: bank details, charges, the 110% payment split, scheduled payouts, a revenue overview and a finance FAQ.',
                'Wrote the back end for it on AWS Lambda and moved the host dashboard styling to SCSS.',
                'Set up how the team works on GitHub: onboarding and release docs, contributing guidelines, issue templates, CODEOWNERS and a security policy.',
            ],
        },
        {
            title: 'Software Developer Intern',
            place: 'ITalent-workspace, Amsterdam',
            period: 'Sep 2022 – Feb 2023',
            points: [
                'Built an Android app in Kotlin for the Red Cross vehicle logistics, with one teammate. I wrote almost all of it.',
                'Volunteers fill in a check form when they take or return a vehicle: accessories, licence plate, events and photos of damage, so every vehicle can be traced back to who used it.',
            ],
        },
        {
            title: 'Automotive Mechanic Intern',
            place: 'Carworx, Amsterdam',
            period: 'Aug 2019 – Jul 2020',
            points: ['Diagnosed faults and did maintenance and repairs on cars.'],
        },
    ],
    experience: [
        {
            title: 'Taxi Driver (self-employed)',
            place: 'Lucky Sardar Services, Volendam',
            period: 'Apr 2023 – present',
            points: ['Run my own taxi business: the rides, the planning, the customer contact and the bookkeeping.'],
        },
        {
            title: 'Delivery Driver',
            place: 'Indian Spices & Vibes, Amsterdam',
            period: 'Apr 2020 – Apr 2021',
            points: ['Took orders, packed meals, worked the till and delivered.'],
        },
        {
            title: 'Delivery Driver and Staff Member',
            place: 'Grillwok, Diemen',
            period: 'May 2016 – Jul 2019',
            points: ['Helped run the family business after school: cooking, phone orders, the till and deliveries.'],
        },
    ],
    skills: [
        { group: 'Languages', items: ['Java', 'TypeScript', 'C#', 'PHP', 'Python'] },
        { group: 'Back end', items: ['Spring Boot', 'Laravel', '.NET', 'Express'] },
        { group: 'Cloud & data', items: ['AWS Lambda', 'Stripe', 'MySQL', 'Docker'] },
        { group: 'Front end', items: ['React', 'Vue', 'Lit', 'SCSS', 'Three.js'] },
        { group: 'Mobile & hardware', items: ['Kotlin', 'Android', 'C++', 'ESP32'] },
        { group: 'Personal', items: ['Hands-on', 'Team player', 'Scrum'] },
    ],
    languages: ['Dutch', 'English', 'Italian', 'Punjabi'],
    interests: ['Building AI agent harnesses', 'Basketball', 'Coding', 'Gaming', 'Going out with friends'],
};

const nl: CvData = {
    name: 'Gurpreet Singh',
    role: 'Software Engineering-student · Back-end developer',
    location: 'Volendam, Nederland',
    summary:
        'Vierdejaars student Software Engineering aan de Hogeschool van Amsterdam (HvA), op zoek naar een afstudeerstage. Ik bouw vooral backends: inloggen, betalen en de pipelines die het online zetten. Bij Domits bouwde ik de betalingen voor verhuurders met Stripe Connect op AWS Lambda. In teamprojecten pak ik meestal het inloggen, de tests en het uitrollen op, en ik schrijf de documentatie waarmee een volgende teamgenoot zelf kan beginnen. Voor software was ik autotechnicus, en naast mijn studie heb ik een eigen taxibedrijf.',
    links: [
        { label: 'E-mail', value: 'hello@guruita.dev', href: 'mailto:hello@guruita.dev' },
        { label: 'Telefoon', value: '+31 6 86215941', href: 'tel:+31686215941' },
        { label: 'Website', value: 'guruita.dev', href: 'https://guruita.dev' },
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
            period: 'sep 2023 – heden',
        },
        {
            title: 'Software Developer (mbo niveau 4)',
            place: 'MBO College Zuidoost, Amsterdam',
            period: 'aug 2020 – jun 2023',
        },
        {
            title: 'Autotechnicus (mbo niveau 2)',
            place: 'MBO College Westpoort, Amsterdam',
            period: 'sep 2018 – sep 2020',
        },
        {
            title: 'Mobiliteit en Transport',
            place: 'Montessori College Oost, Amsterdam',
            period: 'aug 2014 – jun 2018',
        },
    ],
    internships: [
        {
            title: 'Stagiair Software Developer',
            place: 'Domits (Financieelsysteem B.V.), Haarlem',
            period: 'sep 2025 – jan 2026',
            points: [
                'Bouwde het financiële deel voor verhuurders van Domits, een boekingsplatform voor vakantiewoningen, met Stripe Connect: bankgegevens, betalingen, de 110%-verdeling, ingeplande uitbetalingen, een omzetoverzicht en een financiële FAQ.',
                'Schreef de backend daarvoor op AWS Lambda en zette de styling van het verhuurdersdashboard om naar SCSS.',
                'Zette de werkwijze van het team op GitHub op: documentatie voor onboarding en releases, richtlijnen voor bijdragen, issue-templates, CODEOWNERS en een beveiligingsbeleid.',
            ],
        },
        {
            title: 'Stagiair Software Developer',
            place: 'ITalent-workspace, Amsterdam',
            period: 'sep 2022 – feb 2023',
            points: [
                'Bouwde met één teamgenoot een Android-app in Kotlin voor de voertuiglogistiek van het Rode Kruis. Ik schreef bijna de hele app.',
                'Vrijwilligers vullen een controleformulier in als ze een voertuig meenemen of terugbrengen: accessoires, kenteken, gebeurtenissen en foto’s van schade, zodat elk voertuig te herleiden is naar wie het gebruikte.',
            ],
        },
        {
            title: 'Stagiair Automonteur',
            place: 'Carworx, Amsterdam',
            period: 'aug 2019 – jul 2020',
            points: ['Stelde storingen vast en deed onderhoud en reparaties aan auto’s.'],
        },
    ],
    experience: [
        {
            title: 'Taxichauffeur (zzp)',
            place: 'Lucky Sardar Services, Volendam',
            period: 'apr 2023 – heden',
            points: ['Mijn eigen taxibedrijf: de ritten, de planning, het klantcontact en de boekhouding.'],
        },
        {
            title: 'Bezorger',
            place: 'Indian Spices & Vibes, Amsterdam',
            period: 'apr 2020 – apr 2021',
            points: ['Bestellingen aannemen, maaltijden inpakken, afrekenen aan de kassa en bezorgen.'],
        },
        {
            title: 'Bezorger en medewerker',
            place: 'Grillwok, Diemen',
            period: 'mei 2016 – jul 2019',
            points: ['Hielp na school mee in het familiebedrijf: koken, telefonische bestellingen, de kassa en bezorgen.'],
        },
    ],
    skills: [
        { group: 'Programmeertalen', items: ['Java', 'TypeScript', 'C#', 'PHP', 'Python'] },
        { group: 'Backend', items: ['Spring Boot', 'Laravel', '.NET', 'Express'] },
        { group: 'Cloud & data', items: ['AWS Lambda', 'Stripe', 'MySQL', 'Docker'] },
        { group: 'Frontend', items: ['React', 'Vue', 'Lit', 'SCSS', 'Three.js'] },
        { group: 'Mobiel & hardware', items: ['Kotlin', 'Android', 'C++', 'ESP32'] },
        { group: 'Persoonlijk', items: ['Praktisch', 'Teamspeler', 'Scrum'] },
    ],
    languages: ['Nederlands', 'Engels', 'Italiaans', 'Punjabi'],
    interests: ['AI-agent harnesses bouwen', 'Basketbal', 'Programmeren', 'Gamen', 'Uitgaan met vrienden'],
};

export const cv: Texts<CvData> = { en, nl };
