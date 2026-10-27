// Contact form backend for guruita.dev.
// Every message passes these checks before it is forwarded to Formspree:
// method and origin, rate limit per IP, body size, honeypot, field rules,
// a server-side Cloudflare Turnstile check, and a daily and monthly cap for the whole form.

import { DurableObject } from 'cloudflare:workers';

export interface ContactEnv {
    /** Comma separated origins that may post the form, e.g. "https://guruita.dev". */
    ALLOWED_ORIGINS: string;
    /** Most messages forwarded per UTC day, for all visitors together. */
    DAILY_LIMIT: string;
    /** Most messages forwarded per UTC month; keep it below the Formspree plan's monthly quota. */
    MONTHLY_LIMIT: string;
    /** Secret key of the Turnstile widget. */
    TURNSTILE_SECRET: string;
    /** Formspree form endpoint; only the Worker knows it. */
    FORMSPREE_ENDPOINT: string;
    IP_LIMITER: RateLimit;
    MESSAGE_QUOTA: DurableObjectNamespace<MessageQuota>;
}

interface QuotaState {
    day: string;
    dayCount: number;
    month: string;
    monthCount: number;
}

/**
 * Counts forwarded messages for the whole form. There is one instance, so the count is exact:
 * Cloudflare runs its requests one at a time, unlike rate limit bindings, which count per location.
 */
export class MessageQuota extends DurableObject<ContactEnv> {
    /**
     * Takes one message from today's and this month's allowance.
     *
     * @param dailyLimit - Most messages per UTC day.
     * @param monthlyLimit - Most messages per UTC month.
     * @param now - Current time in milliseconds; tests pass their own.
     * @returns True when the message fits in both allowances and was counted.
     */
    async take(dailyLimit: number, monthlyLimit: number, now: number = Date.now()): Promise<boolean> {
        const date = new Date(now).toISOString();
        const day = date.slice(0, 10);
        const month = date.slice(0, 7);
        const saved = await this.ctx.storage.get<QuotaState>('quota');

        // A new day or month starts counting from zero.
        const dayCount = saved?.day === day ? saved.dayCount : 0;
        const monthCount = saved?.month === month ? saved.monthCount : 0;
        if (dayCount >= dailyLimit || monthCount >= monthlyLimit) {
            return false;
        }

        await this.ctx.storage.put<QuotaState>('quota', {
            day,
            dayCount: dayCount + 1,
            month,
            monthCount: monthCount + 1,
        });
        return true;
    }
}

const MAX_BODY_BYTES = 16 * 1024;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'contact';
// Prefix of Cloudflare's dummy secrets for local testing (https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
const TURNSTILE_TEST_SECRET_PREFIX = '1x0000000000000000000000000000000';
// Simple shape check; the real proof that an address works is a reply.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTER = /\p{Cc}/u;

type ErrorCode =
    | 'not_found'
    | 'method_not_allowed'
    | 'forbidden_origin'
    | 'too_large'
    | 'bad_request'
    | 'invalid_fields'
    | 'verification_failed'
    | 'rate_limited'
    | 'quota_reached'
    | 'delivery_failed';

interface ContactMessage {
    name: string;
    email: string;
    message: string;
}

interface TurnstileResult {
    success: boolean;
    hostname?: string;
    action?: string;
}

/**
 * Splits the ALLOWED_ORIGINS variable into a list.
 *
 * @param value - Comma separated origins.
 * @returns The trimmed, non-empty origins.
 */
function parseOrigins(value: string): string[] {
    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

/**
 * Reads a cap from a Worker variable.
 *
 * @param value - The variable as text, e.g. "10".
 * @returns The number, or 0 when it is missing or not a number, so a config mistake blocks messages instead of removing the cap.
 */
function readLimit(value: string | undefined): number {
    const limit = Number(value);
    return Number.isFinite(limit) && limit >= 0 ? limit : 0;
}

/**
 * Turns the visitor's IP address into the key for the per-IP rate limit.
 * IPv6 users usually get a whole /64 block, so one person could switch addresses
 * inside it to dodge the limit; the key is therefore the /64 prefix.
 *
 * @param ip - The CF-Connecting-IP header value.
 * @returns The IPv4 address, the IPv6 /64 prefix, or "unknown".
 */
export function rateLimitKey(ip: string): string {
    // IPv4, also when written as an IPv4-mapped IPv6 address (::ffff:203.0.113.7).
    if (ip.includes('.')) {
        return ip.slice(ip.lastIndexOf(':') + 1);
    }
    if (!ip.includes(':')) {
        return ip || 'unknown';
    }

    // Expand "::" so the first four groups are always the /64 prefix.
    const [head, tail = ''] = ip.split('::');
    const headGroups = head ? head.split(':') : [];
    const tailGroups = tail ? tail.split(':') : [];
    const missing = ip.includes('::') ? 8 - headGroups.length - tailGroups.length : 0;
    const groups = [...headGroups, ...Array<string>(Math.max(missing, 0)).fill('0'), ...tailGroups];
    return `${groups
        .slice(0, 4)
        .map((group) => group.toLowerCase().padStart(4, '0'))
        .join(':')}::/64`;
}

/**
 * Builds a JSON response with CORS headers for an allowed origin.
 *
 * @param body - The JSON body.
 * @param status - HTTP status code.
 * @param origin - The allowed origin to echo back, or null to leave CORS out.
 * @returns The response.
 */
function json(body: object, status: number, origin: string | null): Response {
    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        Vary: 'Origin',
    });
    if (origin) {
        headers.set('Access-Control-Allow-Origin', origin);
    }
    return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Builds an error response with a short machine-readable code.
 *
 * @param code - What went wrong.
 * @param status - HTTP status code.
 * @param origin - The allowed origin, or null.
 * @returns The response.
 */
function fail(code: ErrorCode, status: number, origin: string | null): Response {
    return json({ ok: false, error: code }, status, origin);
}

/**
 * Reads a text field from the form and trims it.
 *
 * @param form - The parsed form data.
 * @param name - Field name.
 * @returns The trimmed value, or an empty string when missing or not text.
 */
function field(form: FormData, name: string): string {
    const value = form.get(name);
    return typeof value === 'string' ? value.trim() : '';
}

/**
 * Checks the visitor's fields and keeps only the ones we forward.
 * Anything else (for example Formspree's `_cc` or `_next`) is dropped.
 *
 * @param form - The parsed form data.
 * @returns The clean message, or null when a field breaks the rules.
 */
function validate(form: FormData): ContactMessage | null {
    const name = field(form, 'name');
    const email = field(form, 'email');
    // Multipart bodies turn every line break into CRLF; count it as one character, like the browser's textarea.
    const message = field(form, 'message').replace(/\r\n?/g, '\n');

    // No control characters such as line breaks: the name also goes into the e-mail subject.
    const nameOk = name.length > 0 && name.length <= MAX_NAME_LENGTH && !CONTROL_CHARACTER.test(name);
    const emailOk = email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
    const messageOk =
        message.length >= MIN_MESSAGE_LENGTH && message.length <= MAX_MESSAGE_LENGTH;

    return nameOk && emailOk && messageOk ? { name, email, message } : null;
}

/**
 * Reads the request body, refusing bodies above the size limit
 * even when the client leaves out or lies about Content-Length.
 *
 * @param request - The incoming request.
 * @returns The body bytes, or null when it is too large.
 */
async function readLimitedBody(request: Request): Promise<Uint8Array | null> {
    const declared = Number(request.headers.get('Content-Length') ?? '0');
    if (declared > MAX_BODY_BYTES || !request.body) {
        return declared > MAX_BODY_BYTES ? null : new Uint8Array();
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        size += value.byteLength;
        // Stop reading as soon as the limit is passed.
        if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }

    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
}

/**
 * Asks Cloudflare whether the Turnstile token is real, unused and made for this form.
 *
 * @param token - The `cf-turnstile-response` value from the form.
 * @param ip - The visitor's IP address.
 * @param env - Worker environment with the secret and allowed origins.
 * @returns True when the token is valid for one of our hostnames and the contact action.
 */
async function verifyTurnstile(token: string, ip: string, env: ContactEnv): Promise<boolean> {
    if (!token || token.length > 2048) {
        return false;
    }

    const body = new FormData();
    body.set('secret', env.TURNSTILE_SECRET);
    body.set('response', token);
    if (ip) {
        body.set('remoteip', ip);
    }

    try {
        const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
        if (!response.ok) {
            return false;
        }
        const result = (await response.json()) as TurnstileResult;
        const hostnames = parseOrigins(env.ALLOWED_ORIGINS).map((origin) => new URL(origin).hostname);

        // Cloudflare's test secrets answer with a dummy hostname and action, so only check those for real keys.
        // A test secret on the live site would let every bot through, so it only counts on localhost.
        if (env.TURNSTILE_SECRET.startsWith(TURNSTILE_TEST_SECRET_PREFIX)) {
            return result.success === true && hostnames.every((hostname) => hostname === 'localhost');
        }
        return (
            result.success === true &&
            hostnames.includes(result.hostname ?? '') &&
            result.action === TURNSTILE_ACTION
        );
    } catch {
        return false;
    }
}

/**
 * Sends a checked message on to Formspree.
 *
 * @param message - The validated fields.
 * @param origin - The site the visitor used, sent as Referer for Formspree's domain restriction.
 * @param env - Worker environment with the Formspree endpoint.
 * @returns True when Formspree accepted the message.
 */
async function forward(message: ContactMessage, origin: string, env: ContactEnv): Promise<boolean> {
    try {
        const response = await fetch(env.FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Origin: origin,
                Referer: `${origin}/`,
            },
            body: JSON.stringify({
                name: message.name,
                email: message.email,
                message: message.message,
                _subject: `Portfolio message from ${message.name}`,
            }),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export default {
    /**
     * Handles one request to the contact endpoint.
     *
     * @param request - The incoming request.
     * @param env - Worker environment (variables, secrets and rate limiters).
     * @returns A JSON response: `{ ok: true }` or `{ ok: false, error }`.
     */
    async fetch(request: Request, env: ContactEnv): Promise<Response> {
        const url = new URL(request.url);
        const requestOrigin = request.headers.get('Origin') ?? '';
        const allowedOrigin = parseOrigins(env.ALLOWED_ORIGINS).includes(requestOrigin)
            ? requestOrigin
            : null;

        if (url.pathname !== '/') {
            return fail('not_found', 404, allowedOrigin);
        }

        // Browsers only send a preflight when extra headers are used; answer it for allowed sites only.
        if (request.method === 'OPTIONS') {
            if (!allowedOrigin) {
                return fail('forbidden_origin', 403, null);
            }
            const response = new Response(null, { status: 204 });
            response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
            response.headers.set('Access-Control-Allow-Methods', 'POST');
            response.headers.set('Access-Control-Allow-Headers', 'Accept');
            response.headers.set('Access-Control-Max-Age', '86400');
            response.headers.set('Vary', 'Origin');
            return response;
        }

        if (request.method !== 'POST') {
            return fail('method_not_allowed', 405, allowedOrigin);
        }

        // Only our own site may use the form. Scripts can fake this header, which is why Turnstile follows.
        if (!allowedOrigin) {
            return fail('forbidden_origin', 403, null);
        }

        const ip = request.headers.get('CF-Connecting-IP') ?? '';
        const ipLimit = await env.IP_LIMITER.limit({ key: rateLimitKey(ip) });
        if (!ipLimit.success) {
            return fail('rate_limited', 429, allowedOrigin);
        }

        const body = await readLimitedBody(request);
        if (!body) {
            return fail('too_large', 413, allowedOrigin);
        }

        let form: FormData;
        try {
            const contentType = request.headers.get('Content-Type') ?? '';
            form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
        } catch {
            return fail('bad_request', 400, allowedOrigin);
        }

        // Honeypot filled in: answer as if it worked, so a bot learns nothing, and drop the message.
        if (field(form, '_gotcha')) {
            return json({ ok: true }, 200, allowedOrigin);
        }

        const message = validate(form);
        if (!message) {
            return fail('invalid_fields', 422, allowedOrigin);
        }

        const verified = await verifyTurnstile(field(form, 'cf-turnstile-response'), ip, env);
        if (!verified) {
            return fail('verification_failed', 403, allowedOrigin);
        }

        // Counted only for messages that passed every check, so junk cannot use up the allowance.
        // A message whose delivery fails below still uses its slot; with these small caps that is fine.
        const quota = env.MESSAGE_QUOTA.get(env.MESSAGE_QUOTA.idFromName('contact-form'));
        const withinQuota = await quota.take(readLimit(env.DAILY_LIMIT), readLimit(env.MONTHLY_LIMIT));
        if (!withinQuota) {
            return fail('quota_reached', 503, allowedOrigin);
        }

        const delivered = await forward(message, allowedOrigin, env);
        if (!delivered) {
            return fail('delivery_failed', 502, allowedOrigin);
        }

        return json({ ok: true }, 200, allowedOrigin);
    },
} satisfies ExportedHandler<ContactEnv>;
