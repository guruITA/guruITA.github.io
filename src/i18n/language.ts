import { useSyncExternalStore } from 'react';

// The site is written in English and has a Dutch version of every text. New visitors get English;
// a language picked with the switch is remembered in this browser, on the portfolio and the CV page alike.
export type Language = 'en' | 'nl';

// Every text of the site comes as one of these: an English and a Dutch version of the same shape,
// so TypeScript reports a missing translation
export type Texts<T> = Record<Language, T>;

const STORAGE_KEY = 'language';
const listeners = new Set<() => void>();

function readStored(): Language {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'nl' ? 'nl' : 'en';
    } catch {
        // storage can be blocked (some private modes); the site then simply stays in English
        return 'en';
    }
}

let current = readStored();
document.documentElement.lang = current;

function apply(language: Language) {
    if (language === current) {
        return;
    }
    current = language;
    // screen readers and the browser's own spell check and hyphenation follow this
    document.documentElement.lang = language;
    listeners.forEach((listener) => listener());
}

export function setLanguage(language: Language) {
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // not remembered, but the switch still works on this page
    }
    apply(language);
}

// a switch in another tab (e.g. the CV page next to the portfolio) changes this tab too
window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
        apply(readStored());
    }
});

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useLanguage(): Language {
    return useSyncExternalStore(subscribe, () => current);
}

// The texts of the current language, e.g. `const t = useTexts(text)`
export function useTexts<T>(texts: Texts<T>): T {
    return texts[useLanguage()];
}
