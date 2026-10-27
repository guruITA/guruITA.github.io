// Loads Cloudflare Turnstile, the check that tells people and bots apart.
// The token it gives is verified again by the contact Worker, so a bot cannot skip it.

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export interface TurnstileOptions {
    sitekey: string;
    action: string;
    theme?: 'auto' | 'light' | 'dark';
    appearance?: 'always' | 'execute' | 'interaction-only';
    size?: 'normal' | 'flexible' | 'compact';
    callback?: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
}

export interface TurnstileApi {
    render(container: HTMLElement, options: TurnstileOptions): string;
    reset(widgetId: string): void;
    remove(widgetId: string): void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

let loading: Promise<TurnstileApi> | null = null;

/**
 * Adds the Turnstile script to the page once and waits until it is ready.
 *
 * @returns A promise with the Turnstile API; it rejects when the script cannot load.
 */
export function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }
    if (loading) {
        return loading;
    }

    loading = new Promise<TurnstileApi>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => {
            // The script defines window.turnstile while it runs, so it exists by now.
            if (window.turnstile) {
                resolve(window.turnstile);
            } else {
                reject(new Error('Turnstile loaded without its API'));
            }
        };
        script.onerror = () => {
            // Forget the failed attempt, so the next call can try again.
            loading = null;
            script.remove();
            reject(new Error('Turnstile script failed to load'));
        };
        document.head.appendChild(script);
    });
    return loading;
}
