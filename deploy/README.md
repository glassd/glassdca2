# Deployment notes

The app is built and deployed by **Dokploy** on the OVH VPS, triggered by
pushes to the tracked branch on GitHub. Sanity Studio is deployed
separately, to Sanity's own hosting.

---

## Deploy safety

Both features added in Phase 3 are env-gated and fail soft, so the app
can ship before any infrastructure exists:

| Unset variable     | Behaviour                                          |
| ------------------ | -------------------------------------------------- |
| `UMAMI_SRC`        | No tracker injected. No script tag, no requests.    |
| `UMAMI_WEBSITE_ID` | Same — both must be set for the tracker to render.  |
| `DATABASE_URL`     | Rate limiting uses per-process memory, as before.   |

There is no ordering hazard: deploy first and switch things on later, or
set them up first. Nothing throws when they are absent, and a database
that is configured but unreachable falls back to memory rather than
rejecting submissions.

---

## Sanity Studio

The case-study fields (`bodyMarkdown`, `role`, `timeframe`, `outcome`,
`gallery`, `featured`) live in `sanity-cms/schemaTypes/project.ts`. They
do not appear in the Studio until it is redeployed:

    cd sanity-cms
    bun install
    bun run deploy

Until then the fields exist in the codebase and are queried by the site,
but there is no UI to fill them in.

---

## Analytics (Umami)

### 1. Stand up Umami

Check Dokploy's template library first — if it carries Umami, use it and
skip the compose file, since the template wires up Traefik and TLS for
you.

Otherwise create a **Compose** service in Dokploy pointed at
`umami-compose.yml` in this directory. Dokploy routes through Traefik on
its own network, so set the domain in Dokploy's UI rather than publishing
ports; the commented `dokploy-network` block in the compose file covers
this.

Set these in the service's environment:

    UMAMI_DB_PASSWORD=<generated>
    UMAMI_APP_SECRET=<openssl rand -base64 32>

### 2. Point a hostname at it

Give it its own subdomain (`stats.glassd.ca`) in Dokploy so Traefik
issues a certificate. Do not serve it from the site's own domain.

### 3. Wire the app to it

Log in, change the default admin credentials immediately, add `glassd.ca`
as a website, and copy the generated ID into the app's environment in
Dokploy:

    UMAMI_SRC=https://stats.glassd.ca/script.js
    UMAMI_WEBSITE_ID=<id from the Umami UI>

Both are read per request in `app/root.tsx`, so this needs a restart but
not a rebuild.

### Why self-hosted

Umami sets no cookies and stores no personal data, so the site needs no
consent banner — which is also why the contact page can say "no cookies"
and have it stay true.

### Events

Pageviews are automatic. Custom events are declared in
`app/lib/analytics.ts` and fired from the components that own them:

| Event              | Fired from         | Answers                                     |
| ------------------ | ------------------ | ------------------------------------------- |
| `project-outbound` | project case study | Which project pulls people through?          |
| `contact-start`    | contact form       | How many people begin the form?              |
| `contact-submit`   | contact form       | How many finish? (start − submit = drop-off) |
| `post-depth`       | blog post          | Do readers reach the end? (25/50/75/100)     |

---

## Rate limiting (optional)

`DATABASE_URL` makes the contact form's per-IP limits survive a deploy.
Without it they reset every time the container restarts.

Cleanest option is a **Postgres database service in Dokploy**, separate
from Umami's, using the internal connection string Dokploy generates:

    DATABASE_URL=postgresql://user:pass@host:5432/glassdca

The two tables are created on first use — there is no migration step, and
losing them costs nothing, since they are pure throttling state.

---

## Email

Mail goes through an Office 365 Exchange connector restricted to the VPS
IP. That connector is for **transactional mail only** — the contact form.
Microsoft's terms exclude bulk and marketing mail from Exchange Online,
and its throughput limits are far below a newsletter send.

If a mailing list is ever added, it needs a separate bulk provider on its
own subdomain with its own DKIM key, so newsletter sending reputation
cannot affect the address clients use to reach you.
