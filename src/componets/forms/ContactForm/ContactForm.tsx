import { useState, type FormEvent } from 'react';
import styles from './ContactForm.module.scss';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const FORM_ENDPOINT = import.meta.env.VITE_CONTACT_FORM_ENDPOINT as
    | string
    | undefined;

function ContactForm() {
    const [status, setStatus] = useState<Status>('idle');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        // Honeypot: real visitors never fill this hidden field, bots usually do.
        if (data.get('company')) {
            return;
        }

        if (!FORM_ENDPOINT) {
            console.warn(
                'VITE_CONTACT_FORM_ENDPOINT is not configured — see .env.example.',
            );
            setStatus('error');
            return;
        }

        setStatus('submitting');

        try {
            const response = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: data,
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                setStatus('success');
                form.reset();
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
                <label className={styles.field}>
                    <span className={styles.srOnly}>Your name</span>
                    <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        required
                        autoComplete="name"
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.srOnly}>Your email</span>
                    <input
                        type="email"
                        name="email"
                        placeholder="Your email"
                        required
                        autoComplete="email"
                    />
                </label>
            </div>

            <label className={styles.field}>
                <span className={styles.srOnly}>Your message</span>
                <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell me about your idea or question…"
                />
            </label>

            <input
                type="text"
                name="company"
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
            />

            <div className={styles.actions}>
                <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={status === 'submitting'}
                >
                    {status === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
                <a
                    className={styles.githubLink}
                    href="https://github.com/guruITA"
                    target="_blank"
                    rel="noreferrer"
                >
                    View GitHub
                </a>
            </div>

            {status === 'success' && (
                <p className={styles.statusMessage} role="status">
                    Thanks — your message is on its way. I&apos;ll reply soon.
                </p>
            )}
            {status === 'error' && (
                <p
                    className={`${styles.statusMessage} ${styles.statusError}`}
                    role="alert"
                >
                    Something went wrong. Please try again in a moment.
                </p>
            )}
        </form>
    );
}

export default ContactForm;
