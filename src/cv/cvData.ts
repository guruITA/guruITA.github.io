// The one place the CV lives: the /cv/ page renders it and the build prints that page to the PDF.
// Public: e-mail, phone and personal details are on it at the owner's request; no street address.

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

export const cv: CvData = {
    name: 'Gurpreet Singh',
    role: 'Software Engineering student · Full-stack developer',
    location: 'Volendam, the Netherlands',
    summary:
        'Driven fourth-year Software Engineering student at the Amsterdam University of Applied Sciences, with a strong focus on back-end development and a passion for innovative solutions. Alongside my skills in Java, PHP and JavaScript, I have hands-on experience building apps with real impact, such as a damage detection app for the Red Cross and the host payment system of the Domits booking platform. With knowledge of Laravel, Spring Boot, Vue.js and Kotlin, I am an analytical problem solver who always strives for efficiency and quality. I enjoy learning and applying new technologies, and I am looking for a graduation internship where I can use my creativity and technical skills to add value to a dynamic team.',
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
                'Built the host finance part of Domits, a holiday rental booking platform, with Stripe Connect: account and bank details, charges and payouts, the 110% payment split, payout scheduling, a revenue overview and a finance FAQ.',
                'Backend on AWS Lambda; moved the host dashboard styling to SCSS.',
                'Set up the team workflow on GitHub: onboarding and release documentation, contributing guidelines, issue templates, CODEOWNERS and a security policy.',
            ],
        },
        {
            title: 'Software Developer Intern',
            place: 'ITalent-workspace, Amsterdam',
            period: 'Sep 2022 – Feb 2023',
            points: [
                'Built an Android app in Kotlin for the Red Cross, in which volunteers enter their details before they leave with a vehicle.',
                'Users add accessories, licence plates and events, plus photos for damage detection, so the people responsible can be identified and vehicles traced back.',
            ],
        },
        {
            title: 'Automotive Mechanic Intern',
            place: 'Carworx, Amsterdam',
            period: 'Aug 2019 – Jul 2020',
            points: [
                'Worked on vehicles, diagnosed problems and carried out maintenance and repairs to keep them safe and working.',
            ],
        },
    ],
    experience: [
        {
            title: 'Taxi Driver (self-employed)',
            place: 'Lucky Sardar Services, Volendam',
            period: 'Apr 2023 – present',
            points: [
                'Run my own taxi business: safe and reliable transport with a strong focus on customer satisfaction, including the administration.',
            ],
        },
        {
            title: 'Delivery Driver',
            place: 'Indian Spices & Vibes, Amsterdam',
            period: 'Apr 2020 – Apr 2021',
            points: [
                'Packed meals, took orders and worked the till, with excellent customer service and efficient handling of deliveries.',
            ],
        },
        {
            title: 'Delivery Driver and Staff Member',
            place: 'Grillwok, Diemen',
            period: 'May 2016 – Jul 2019',
            points: [
                'Helped run the family business after school: preparing meals, packing and taking phone orders, working the till and handling deliveries.',
            ],
        },
    ],
    skills: [
        { group: 'Languages', items: ['Java', 'PHP', 'JavaScript', 'Kotlin'] },
        { group: 'Frameworks & tools', items: ['Laravel', 'Spring Boot', 'Vue.js', 'AWS Lambda', 'Stripe'] },
        { group: 'Personal', items: ['Eager to learn', 'Hands-on', 'Patient', 'Helpful', 'Team player'] },
    ],
    languages: ['Dutch', 'English', 'Italian', 'Punjabi'],
    interests: ['Building AI agent harnesses', 'Basketball', 'Coding', 'Gaming', 'Going out with friends'],
};
