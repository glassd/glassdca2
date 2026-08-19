# Deployment notes

## Analytics (Umami)

`umami-compose.yml` runs Umami and its Postgres on the VPS. It is a
separate stack from the app so the two restart independently.

    cp .env.example .env      # fill in UMAMI_DB_PASSWORD and UMAMI_APP_SECRET
    docker compose -f umami-compose.yml up -d

Then, in the app's environment:

    UMAMI_SRC=https://stats.glassd.ca/script.js
    UMAMI_WEBSITE_ID=<the id Umami generates for glassd.ca>

Both are read at request time in `app/root.tsx`, so changing them needs a
restart but not a rebuild. Leave them unset and no tracker is injected —
which is what local development does.

### Why the tracker is self-hosted

Umami sets no cookies and stores no personal data, so the site needs no
consent banner. That is also why the contact page can claim "no cookies"
and have it stay true.

### Events

Pageviews are automatic. Custom events are defined in
`app/lib/analytics.ts` and fired from the components that own them:

| Event              | Fired from            | Answers                                  |
| ------------------ | --------------------- | ---------------------------------------- |
| `project-outbound` | project case study    | Which project pulls people to the work?   |
| `contact-start`    | contact form          | How many people begin the form?           |
| `contact-submit`   | contact form          | How many finish it? (start − submit = drop) |
| `post-depth`       | blog post             | Do readers reach the end? (25/50/75/100)  |

## Rate limiting

`DATABASE_URL` is optional. When unset, the contact form's rate limiter
falls back to per-process in-memory counters — fine for a single
instance, but the limits reset on every deploy. Point it at a database to
make them durable.
