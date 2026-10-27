import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import worker, { MessageQuota, rateLimitKey, type ContactEnv } from '../src/index.ts';

const ORIGIN = 'https://guruita.dev';
const FORMSPREE = 'https://formspree.io/f/test';
const REAL_SECRET = '0x4AAAAAAAreal-secret';

interface Call {
    url: string;
    body: unknown;
}

let calls: Call[] = [];
let turnstileReply: Record<string, unknown> = {};
let formspreeOk = true;
const realFetch = globalThis.fetch;

/**
 * Builds a rate limiter stub.
 *
 * @param allowed - Whether `limit()` lets the request through.
 * @returns An object with the same `limit` method as a Workers RateLimit binding.
 */
function limiter(allowed: boolean) {
    return { limit: async () => ({ success: allowed }) } as unknown as RateLimit;
}

/**
 * Builds a stand-in for the MessageQuota Durable Object namespace.
 *
 * @param allowed - Whether `take()` lets the message through.
 * @returns An object with the `idFromName` and `get` methods the Worker uses.
 */
function quota(allowed: boolean) {
    return {
        idFromName: () => ({}),
        get: () => ({ take: async () => allowed }),
    } as unknown as ContactEnv['MESSAGE_QUOTA'];
}

/**
 * Builds a Worker environment for one test.
 *
 * @param overrides - Values that differ from the defaults.
 * @returns The environment.
 */
function env(overrides: Partial<ContactEnv> = {}): ContactEnv {
    return {
        ALLOWED_ORIGINS: ORIGIN,
        DAILY_LIMIT: '10',
        MONTHLY_LIMIT: '45',
        TURNSTILE_SECRET: REAL_SECRET,
        FORMSPREE_ENDPOINT: FORMSPREE,
        IP_LIMITER: limiter(true),
        MESSAGE_QUOTA: quota(true),
        ...overrides,
    };
}

/**
 * Builds a valid form, with optional changed or extra fields.
 *
 * @param fields - Fields to set on top of the valid defaults.
 * @returns The form data.
 */
function form(fields: Record<string, string> = {}): FormData {
    const data = new FormData();
    const values = {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'I would like to talk about a project.',
        'cf-turnstile-response': 'token-123',
        ...fields,
    };
    for (const [key, value] of Object.entries(values)) {
        data.set(key, value);
    }
    return data;
}

/**
 * Builds a POST request to the Worker.
 *
 * @param body - Form data to send.
 * @param origin - Origin header, or null to leave it out.
 * @returns The request.
 */
function post(body: FormData, origin: string | null = ORIGIN): Request {
    const headers: Record<string, string> = { 'CF-Connecting-IP': '203.0.113.7' };
    if (origin) {
        headers.Origin = origin;
    }
    return new Request('https://contact.example.workers.dev/', { method: 'POST', body, headers });
}

beforeEach(() => {
    calls = [];
    formspreeOk = true;
    turnstileReply = { success: true, hostname: 'guruita.dev', action: 'contact' };
    // Stand-ins for Cloudflare's siteverify API and for Formspree.
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input instanceof Request ? input.url : input);
        const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
        calls.push({ url, body });
        if (url.includes('turnstile')) {
            return Response.json(turnstileReply);
        }
        return new Response('{}', { status: formspreeOk ? 200 : 500 });
    }) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

/**
 * Lists which outside services the Worker called.
 *
 * @returns "turnstile" and/or "formspree" per call, in order.
 */
function services(): string[] {
    return calls.map((call) => (call.url.includes('turnstile') ? 'turnstile' : 'formspree'));
}

describe('contact form worker', () => {
    it('forwards a valid message with only the known fields', async () => {
        const response = await worker.fetch(post(form({ _cc: 'victim@example.com', _next: 'https://evil.example' })), env());
        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
        expect(services()).toEqual(['turnstile', 'formspree']);
        expect(Object.keys(calls[1].body as object).sort()).toEqual(['_subject', 'email', 'message', 'name']);
    });

    it('counts a line break as one character, as the browser does', async () => {
        // 4999 characters in the browser (with one LF); the multipart body makes the LF a CRLF.
        const message = `${'a'.repeat(2499)}\r\n${'b'.repeat(2499)}`;
        const response = await worker.fetch(post(form({ message })), env());
        expect(response.status).toBe(200);
        expect((calls[1].body as { message: string }).message).toBe(`${'a'.repeat(2499)}\n${'b'.repeat(2499)}`);
    });

    it('rejects other methods and paths', async () => {
        const get = await worker.fetch(new Request('https://w.dev/', { headers: { Origin: ORIGIN } }), env());
        expect(get.status).toBe(405);
        const path = await worker.fetch(new Request('https://w.dev/admin', { method: 'POST' }), env());
        expect(path.status).toBe(404);
        expect(services()).toEqual([]);
    });

    it('rejects posts from other sites or without an origin', async () => {
        const other = await worker.fetch(post(form(), 'https://evil.example'), env());
        expect(other.status).toBe(403);
        expect(other.headers.get('Access-Control-Allow-Origin')).toBe(null);
        const none = await worker.fetch(post(form(), null), env());
        expect(none.status).toBe(403);
        expect(services()).toEqual([]);
    });

    it('rejects a body above the size limit, also without Content-Length', async () => {
        const big = await worker.fetch(post(form({ message: 'x'.repeat(20_000) })), env());
        expect(big.status).toBe(413);

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('a'.repeat(20_000)));
                controller.close();
            },
        });
        const chunked = new Request('https://w.dev/', {
            method: 'POST',
            body: stream,
            headers: { Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' },
            duplex: 'half',
        } as RequestInit);
        const response = await worker.fetch(chunked, env());
        expect(response.status).toBe(413);
        expect(services()).toEqual([]);
    });

    it('rejects a body that is not form data', async () => {
        const request = new Request('https://w.dev/', {
            method: 'POST',
            body: '{"name":"x"}',
            headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
        });
        const response = await worker.fetch(request, env());
        expect(response.status).toBe(400);
    });

    it('stops a visitor who sends too often', async () => {
        const response = await worker.fetch(post(form()), env({ IP_LIMITER: limiter(false) }));
        expect(response.status).toBe(429);
        expect(services()).toEqual([]);
    });

    it('drops honeypot submissions but answers ok', async () => {
        const response = await worker.fetch(post(form({ _gotcha: 'http://spam.example' })), env());
        expect(response.status).toBe(200);
        expect(services()).toEqual([]);
    });

    for (const [label, fields] of [
        ['an empty name', { name: '   ' }],
        ['a name with a line break', { name: 'Ada\nBcc: victim@example.com' }],
        ['a too long name', { name: 'n'.repeat(101) }],
        ['a broken email', { email: 'not-an-email' }],
        ['a too long email', { email: `${'e'.repeat(250)}@x.io` }],
        ['a message of spaces', { message: '              ' }],
        ['a too short message', { message: 'hi there' }],
        ['a too long message', { message: 'm'.repeat(5001) }],
    ] as const) {
        it(`rejects ${label}`, async () => {
            const response = await worker.fetch(post(form(fields)), env());
            expect(response.status).toBe(422);
            expect(services()).toEqual([]);
        });
    }

    it('rejects a missing or failed Turnstile check', async () => {
        const missing = await worker.fetch(post(form({ 'cf-turnstile-response': '' })), env());
        expect(missing.status).toBe(403);

        turnstileReply = { success: false };
        const failed = await worker.fetch(post(form()), env());
        expect(failed.status).toBe(403);
        expect(services()).toEqual(['turnstile']);
    });

    it('rejects a Turnstile token made on another site or for another action', async () => {
        turnstileReply = { success: true, hostname: 'evil.example', action: 'contact' };
        const host = await worker.fetch(post(form()), env());
        expect(host.status).toBe(403);

        turnstileReply = { success: true, hostname: 'guruita.dev', action: 'login' };
        const action = await worker.fetch(post(form()), env());
        expect(action.status).toBe(403);
        expect(services()).toEqual(['turnstile', 'turnstile']);
    });

    it('refuses the always-pass test secret outside localhost', async () => {
        const testSecret = '1x0000000000000000000000000000000AA';
        const live = await worker.fetch(post(form()), env({ TURNSTILE_SECRET: testSecret }));
        expect(live.status).toBe(403);

        const local = 'http://localhost:5173';
        const dev = await worker.fetch(
            post(form(), local),
            env({ TURNSTILE_SECRET: testSecret, ALLOWED_ORIGINS: local }),
        );
        expect(dev.status).toBe(200);
    });

    it('stops valid messages once the daily or monthly cap is used up', async () => {
        const response = await worker.fetch(post(form()), env({ MESSAGE_QUOTA: quota(false) }));
        expect(response.status).toBe(503);
        expect(services()).toEqual(['turnstile']);
    });

    it('blocks messages when a cap variable is missing instead of removing the cap', async () => {
        let limits: number[] = [];
        const recording = {
            idFromName: () => ({}),
            get: () => ({
                take: async (daily: number, monthly: number) => {
                    limits = [daily, monthly];
                    return new MessageQuota(
                        { storage: { get: async () => undefined, put: async () => {} } } as unknown as DurableObjectState,
                        {} as ContactEnv,
                    ).take(daily, monthly);
                },
            }),
        } as unknown as ContactEnv['MESSAGE_QUOTA'];
        const response = await worker.fetch(
            post(form()),
            env({ MESSAGE_QUOTA: recording, DAILY_LIMIT: undefined as unknown as string, MONTHLY_LIMIT: 'lots' }),
        );
        expect(limits).toEqual([0, 0]);
        expect(response.status).toBe(503);
    });

    it('reports when Formspree does not accept the message', async () => {
        formspreeOk = false;
        const response = await worker.fetch(post(form()), env());
        expect(response.status).toBe(502);
    });
});

describe('rateLimitKey', () => {
    it('keeps IPv4 addresses, also IPv4-mapped ones', () => {
        expect(rateLimitKey('203.0.113.7')).toBe('203.0.113.7');
        expect(rateLimitKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
    });

    it('groups IPv6 addresses by their /64 block', () => {
        const a = rateLimitKey('2001:db8:abcd:12::1');
        const b = rateLimitKey('2001:0db8:abcd:0012:ffff:ffff:ffff:ffff');
        expect(a).toBe('2001:0db8:abcd:0012::/64');
        expect(b).toBe(a);
        expect(rateLimitKey('2001:db8:abcd:13::1')).not.toBe(a);
    });

    it('has a key when the address is missing', () => {
        expect(rateLimitKey('')).toBe('unknown');
    });
});

describe('MessageQuota', () => {
    /**
     * Builds a MessageQuota on top of an in-memory storage.
     *
     * @returns The quota object.
     */
    function makeQuota(): MessageQuota {
        const store = new Map<string, unknown>();
        const ctx = {
            storage: {
                get: async (key: string) => store.get(key),
                put: async (key: string, value: unknown) => {
                    store.set(key, value);
                },
            },
        } as unknown as DurableObjectState;
        return new MessageQuota(ctx, {} as ContactEnv);
    }

    const day1 = Date.parse('2026-10-27T10:00:00Z');
    const day2 = Date.parse('2026-10-28T10:00:00Z');
    const nextMonth = Date.parse('2026-11-01T10:00:00Z');

    it('allows the daily limit and starts again the next day', async () => {
        const q = makeQuota();
        expect(await q.take(2, 45, day1)).toBe(true);
        expect(await q.take(2, 45, day1)).toBe(true);
        expect(await q.take(2, 45, day1)).toBe(false);
        expect(await q.take(2, 45, day2)).toBe(true);
    });

    it('stops at the monthly limit across days and resets in a new month', async () => {
        const q = makeQuota();
        expect(await q.take(10, 2, day1)).toBe(true);
        expect(await q.take(10, 2, day2)).toBe(true);
        expect(await q.take(10, 2, day2)).toBe(false);
        expect(await q.take(10, 2, nextMonth)).toBe(true);
    });
});
