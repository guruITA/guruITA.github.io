# Contact form Worker

Cloudflare Worker behind the contact form on guruita.dev. The site posts the form here, the Worker checks it, and only then forwards it to Formspree. The Formspree address is a Worker secret, so nobody can post to Formspree directly.

Checks, in order:

1. Path `/` and method `POST` only.
2. `Origin` must be in `ALLOWED_ORIGINS`.
3. At most 3 messages per minute per visitor (IPv4 address, or IPv6 /64 block).
4. Body at most 16 KB.
5. Honeypot field `_gotcha` filled in: the Worker answers "ok" and drops the message.
6. Field rules. Name 1–100 characters without control characters, a valid email of at most 254 characters, and a message of 10–5000 characters. Other fields (for example `_cc` or `_next`) are dropped.
7. Cloudflare Turnstile token, checked with Cloudflare (hostname and action `contact`).
8. At most `DAILY_LIMIT` messages per day and `MONTHLY_LIMIT` per month for the whole form (Durable Object `MessageQuota`, exact count).

## Commands

```bash
npm install
npm test            # unit tests (vitest)
npm run typecheck   # generates worker-configuration.d.ts, then tsc
npm run dev         # local Worker on http://localhost:8787 (copy .dev.vars.example to .dev.vars first)
npm run deploy      # publish to Cloudflare (after `npx wrangler login`)
```

## Secrets

Set these once with `npx wrangler secret put <NAME>`. Never put them in a file in the repo.

- `TURNSTILE_SECRET`: secret key of the Turnstile widget.
- `FORMSPREE_ENDPOINT`: `https://formspree.io/f/...`.

The site needs two public values as GitHub Actions variables: `VITE_CONTACT_FORM_ENDPOINT` (the Worker URL) and `VITE_TURNSTILE_SITE_KEY`.
