import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './ContactForm.module.scss';
import { useTexts } from '../../../i18n/language';
import { loadTurnstile, type TurnstileApi } from './turnstile';

type Status =
    | 'idle'
    | 'submitting'
    | 'success'
    | 'error'
    | 'invalid'
    | 'cooldown'
    | 'verifying'
    | 'unverified'
    | 'busy'
    | 'tooFast';

// URL of the contact Worker (workers/contact-form), which checks every message before it is delivered.
const FORM_ENDPOINT = import.meta.env.VITE_CONTACT_FORM_ENDPOINT as
    | string
    | undefined;
// Public site key of the Turnstile widget; the matching secret lives only in the Worker.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
    | string
    | undefined;

// Bots fill in and send a form almost instantly; people need at least a few seconds.
const MIN_FILL_TIME_MS = 3000;
// After a message was sent, the same browser has to wait before sending another one.
const COOLDOWN_MS = 2 * 60 * 1000;
const LAST_SENT_KEY = 'contact-form-last-sent';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;
// Same rule as the contact Worker, so a rejected address is caught before sending.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = {
    en: {
        name: 'Your name',
        email: 'Your email',
        message: 'Your message',
        messagePlaceholder: 'Tell me about your idea or question…',
        send: 'Send message',
        sending: 'Sending…',
        success: "Thanks, your message is on its way. I'll reply soon.",
        invalid: 'Please check your name and email, and write at least a short sentence about your idea or question.',
        verifying: "One moment, checking that you're not a bot. Please press Send again in a second.",
        tooFast: 'That was quick. Please check your message and press Send again.',
        unverified: 'The spam check could not load. Please turn off blockers for this site or try again later.',
        busy: 'The form has received a lot of messages recently. Please try again later.',
        cooldown: 'You just sent a message. Please wait a few minutes before sending another one.',
        error: 'Something went wrong. Please try again in a moment.',
    },
    nl: {
        name: 'Je naam',
        email: 'Je e-mailadres',
        message: 'Je bericht',
        messagePlaceholder: 'Vertel me over je idee of vraag…',
        send: 'Bericht versturen',
        sending: 'Versturen…',
        success: 'Bedankt, je bericht is onderweg. Ik reageer zo snel mogelijk.',
        invalid: 'Controleer je naam en e-mailadres, en schrijf minstens een korte zin over je idee of vraag.',
        verifying: 'Even geduld, ik controleer of je geen bot bent. Verstuur je bericht zo nog een keer.',
        tooFast: 'Dat ging snel. Controleer je bericht en verstuur het nog een keer.',
        unverified: 'De spamcontrole kon niet laden. Zet adblockers uit voor deze site of probeer het later opnieuw.',
        busy: 'Het formulier heeft de laatste tijd veel berichten gekregen. Probeer het later opnieuw.',
        cooldown: 'Je hebt net een bericht verstuurd. Wacht een paar minuten voordat je er nog een stuurt.',
        error: 'Er ging iets mis. Probeer het zo nog een keer.',
    },
};

/**
 * Reads when this browser last sent a message through the form.
 *
 * @returns The time in milliseconds since the epoch, or 0 when nothing was sent
 * or storage is not available (for example in some private browsing modes).
 */
function readLastSent(): number {
    try {
        // Stored as a plain number string; anything else counts as "never sent".
        const value = Number(localStorage.getItem(LAST_SENT_KEY));
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

/**
 * Remembers that this browser just sent a message, so the cooldown can start.
 *
 * @returns Nothing; storage errors are ignored because the cooldown is only a courtesy limit.
 */
function rememberSent(): void {
    try {
        localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
    } catch {
        // Storage can be blocked; the form still works, just without the cooldown.
    }
}

function ContactForm() {
    const [status, setStatus] = useState<Status>('idle');
    const t = useTexts(text);
    // When the visitor first clicked or typed in the form, to spot submissions that are too fast to be human.
    const startedAt = useRef(0);
    const formRef = useRef<HTMLFormElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const turnstile = useRef<{ api: TurnstileApi; widgetId: string } | null>(null);
    // Latest Turnstile token; each token works for one message only.
    const token = useRef('');
    // Turnstile could not load or reported an error (blocked by an extension, no connection).
    const turnstileFailed = useRef(false);

    // Load Turnstile once the form comes near the screen, so it does not slow down the first view.
    useEffect(() => {
        const form = formRef.current;
        const container = widgetRef.current;
        if (!TURNSTILE_SITE_KEY || !form || !container) {
            return;
        }

        let cancelled = false;
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }
                observer.disconnect();
                loadTurnstile()
                    .then((api) => {
                        if (cancelled) {
                            return;
                        }
                        const widgetId = api.render(container, {
                            sitekey: TURNSTILE_SITE_KEY,
                            action: 'contact',
                            theme: 'dark',
                            // Most visitors never see it; it only shows a checkbox when Cloudflare is unsure.
                            appearance: 'interaction-only',
                            callback: (value) => {
                                token.current = value;
                                turnstileFailed.current = false;
                            },
                            'expired-callback': () => {
                                token.current = '';
                            },
                            'error-callback': () => {
                                // Turnstile retries by itself; a later token clears this again.
                                token.current = '';
                                turnstileFailed.current = true;
                            },
                        });
                        turnstile.current = { api, widgetId };
                    })
                    .catch(() => {
                        // Without Turnstile the Worker refuses the message, so say so on submit.
                        turnstileFailed.current = true;
                    });
            },
            { rootMargin: '400px' },
        );
        observer.observe(form);

        return () => {
            cancelled = true;
            observer.disconnect();
            if (turnstile.current) {
                turnstile.current.api.remove(turnstile.current.widgetId);
                turnstile.current = null;
            }
        };
    }, []);

    /**
     * Remembers when the visitor started on the form; later clicks and keys keep the first time.
     *
     * @returns Nothing.
     */
    function markStarted(): void {
        if (!startedAt.current) {
            startedAt.current = Date.now();
        }
    }

    /**
     * Throws away the used Turnstile token and asks for a fresh one.
     *
     * @returns Nothing.
     */
    function resetTurnstile(): void {
        token.current = '';
        if (turnstile.current) {
            turnstile.current.api.reset(turnstile.current.widgetId);
        }
    }

    /**
     * Checks the form for spam signals and sends it to the form service.
     *
     * @param event - The submit event of the contact form.
     * @returns A promise that resolves once the status has been updated.
     */
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Ignore extra clicks while a message is already on its way.
        if (status === 'submitting') {
            return;
        }

        const form = event.currentTarget;
        const data = new FormData(form);

        // Honeypot filled in, or sent without anyone clicking or typing in the form (a script):
        // act as if it worked, so bots learn nothing.
        const filledHoneypot = Boolean(data.get('_gotcha'));
        if (filledHoneypot || !startedAt.current) {
            setStatus('success');
            form.reset();
            return;
        }

        // Very fast for a person: keep the message and ask to send again, so nothing is lost.
        if (Date.now() - startedAt.current < MIN_FILL_TIME_MS) {
            setStatus('tooFast');
            return;
        }

        // Spaces pass the browser's `required` check and `type=email` accepts addresses like me@localhost,
        // so check the same rules as the Worker.
        const name = String(data.get('name') ?? '').trim();
        const email = String(data.get('email') ?? '').trim();
        const message = String(data.get('message') ?? '').trim();
        if (
            !name ||
            !EMAIL_PATTERN.test(email) ||
            message.length < MIN_MESSAGE_LENGTH ||
            message.length > MAX_MESSAGE_LENGTH
        ) {
            setStatus('invalid');
            return;
        }

        // One message per browser per cooldown period.
        if (Date.now() - readLastSent() < COOLDOWN_MS) {
            setStatus('cooldown');
            return;
        }

        if (!FORM_ENDPOINT || !TURNSTILE_SITE_KEY) {
            console.warn(
                'VITE_CONTACT_FORM_ENDPOINT or VITE_TURNSTILE_SITE_KEY is not configured. See .env.example.',
            );
            setStatus('error');
            return;
        }

        // No token yet: either Turnstile failed, or it is still working out whether this is a person.
        if (!token.current) {
            setStatus(turnstileFailed.current ? 'unverified' : 'verifying');
            return;
        }
        data.set('cf-turnstile-response', token.current);

        setStatus('submitting');

        try {
            const response = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: data,
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                rememberSent();
                setStatus('success');
                form.reset();
            } else if (response.status === 429) {
                setStatus('cooldown');
            } else if (response.status === 422) {
                setStatus('invalid');
            } else if (response.status === 503) {
                setStatus('busy');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        } finally {
            // The token was used up by this attempt, whatever the outcome.
            resetTurnstile();
        }
    }

    return (
        <form
            ref={formRef}
            className={styles.form}
            onSubmit={handleSubmit}
            onFocus={markStarted}
            onInput={markStarted}
        >
            <div className={styles.row}>
                <label className={styles.field}>
                    <span className={styles.srOnly}>{t.name}</span>
                    <input
                        type="text"
                        name="name"
                        placeholder={t.name}
                        required
                        maxLength={MAX_NAME_LENGTH}
                        autoComplete="name"
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.srOnly}>{t.email}</span>
                    <input
                        type="email"
                        name="email"
                        placeholder={t.email}
                        required
                        maxLength={MAX_EMAIL_LENGTH}
                        autoComplete="email"
                    />
                </label>
            </div>

            <label className={styles.field}>
                <span className={styles.srOnly}>{t.message}</span>
                <textarea
                    name="message"
                    required
                    minLength={MIN_MESSAGE_LENGTH}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={4}
                    placeholder={t.messagePlaceholder}
                />
            </label>

            {/* The contact Worker drops any message where `_gotcha` is filled in, also when a bot skips this page. */}
            <input
                type="text"
                name="_gotcha"
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
            />

            <div ref={widgetRef} className={styles.turnstile} />

            <div className={styles.actions}>
                <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? t.sending : t.send}
                </button>
            </div>

            {status === 'success' && (
                <p className={styles.statusMessage} role="status">
                    {t.success}
                </p>
            )}
            {status === 'invalid' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    {t.invalid}
                </p>
            )}
            {status === 'verifying' && (
                <p className={styles.statusMessage} role="status">
                    {t.verifying}
                </p>
            )}
            {status === 'tooFast' && (
                <p className={styles.statusMessage} role="status">
                    {t.tooFast}
                </p>
            )}
            {status === 'unverified' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    {t.unverified}
                </p>
            )}
            {status === 'busy' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    {t.busy}
                </p>
            )}
            {status === 'cooldown' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    {t.cooldown}
                </p>
            )}
            {status === 'error' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    {t.error}
                </p>
            )}
        </form>
    );
}

export default ContactForm;
