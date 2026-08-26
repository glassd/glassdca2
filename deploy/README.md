# Deployment notes

The app is built and deployed by **Dokploy** on the OVH VPS, triggered by
pushes to the tracked branch on GitHub. Sanity Studio is deployed
separately, to Sanity's own hosting.

---

## First-time setup

Ordered because some steps block others. Everything before step 8 can be
done while the branch is still unmerged — the app ignores all of it until
the environment variables are present.

### 0. DNS — do this first, it propagates in the background

Add an A record for `stats.glassd.ca` pointing at the VPS. Traefik cannot
issue a certificate until this resolves, and it is the step most likely
to be sitting half-propagated when you need it.

### 1. Redeploy Sanity Studio

The case-study fields do not exist in the studio UI until this runs.

    cd sanity-cms
    bun install
    bun run deploy

Confirm: open the studio, edit a project, and check for the **Case study**
and **Media** tabs.

### 2. Create the Postgres database service in Dokploy

A **Database → Postgres** service. Enable scheduled backups against your
existing storage. Copy the connection string it generates.

### 3. Add the second database

Against that same instance, once:

    CREATE DATABASE glassdca;

This one is intentionally left out of backups — see **Databases** below.

### 4. Deploy Umami

Template if Dokploy has one, otherwise a **Compose** service pointed at
`deploy/umami-compose.yml`. Environment:

    UMAMI_DATABASE_URL=<connection string from step 2>
    UMAMI_APP_SECRET=<openssl rand -base64 32>

### 5. Attach the domain

Set `stats.glassd.ca` on the Umami service in Dokploy and let it issue the
certificate. Confirm the URL loads over HTTPS before continuing.

### 6. Umami first run

Log in with the default credentials (`admin` / `umami`) and **change the
password immediately** — the instance is publicly reachable by this point.
Then add `glassd.ca` as a website and copy its generated ID.

### 7. Set the app's environment in Dokploy

On the existing site application, not the Umami one:

    UMAMI_SRC=https://stats.glassd.ca/script.js
    UMAMI_WEBSITE_ID=<id from step 6>
    DATABASE_URL=postgresql://user:pass@host:5432/glassdca

### 8. Write at least one case study

The project pages are live the moment this deploys, and they are in the
sitemap. Shipping with all four reading "write-up pending" means search
engines discover four thin pages. Write Pulsio first, and set `featured`
on the two projects worth surfacing on the home page.

### 9. Push

Merging to the tracked branch triggers the Dokploy build.

Afterwards, confirm:

- View source on the homepage — a `<script defer src="https://stats.glassd.ca/script.js">` tag is present
- The Umami dashboard shows the visit
- `/projects/pulsio` renders the case study
- `/sitemap.xml` lists the project URLs

---

## Deploy safety

Both features added in Phase 3 are env-gated and fail soft, so the app
can ship before any infrastructure exists:

| Unset variable     | Behaviour                                          |
| ------------------ | -------------------------------------------------- |
| `UMAMI_SRC`        | No tracker injected. No script tag, no requests.   |
| `UMAMI_WEBSITE_ID` | Same — both must be set for the tracker to render. |
| `DATABASE_URL`     | Rate limiting uses per-process memory, as before.  |

There is no ordering hazard: deploy first and switch things on later, or
set them up first. Nothing throws when they are absent, and a database
that is configured but unreachable falls back to memory rather than
rejecting submissions.

---

## Sanity Studio

Deployed to Sanity's own hosting, not through Dokploy, so it does not
redeploy when the site does. Any change to
`sanity-cms/schemaTypes/*` needs `bun run deploy` from `sanity-cms/`
before the fields appear in the studio UI — the site queries them either
way, so a missed studio deploy shows up as fields you cannot fill in
rather than as an error.

---

## Databases

Postgres runs as a **Dokploy Database service**, not inside a Compose
file, for two reasons:

- Dokploy's scheduled backups only apply to databases it manages. A
  Postgres defined in `umami-compose.yml` would be invisible to them.
- The fallback — snapshotting the data volume — is not a safe backup for
  a running database. It can capture a torn, mid-write state that will
  not restore. `pg_dump`, which the Database service runs, is
  transactionally consistent.

One Postgres instance is enough for both consumers:

| Database   | Holds                       | Back up?                                    |
| ---------- | --------------------------- | ------------------------------------------- |
| `umami`    | All analytics history       | **Yes** — unrecoverable if lost             |
| `glassdca` | Contact-form throttle state | **No** — two tables, recreated on first use |

Create the second database once, by hand, against the same instance:

    CREATE DATABASE glassdca;

Enable scheduled backups on the service and point them at a bucket —
Dokploy backs up to S3-compatible storage, so this needs a destination
(OVH Object Storage, Backblaze B2, or similar) before it will do
anything. **Test a restore once**, into a throwaway database. An untested
backup is a guess.

---

## Analytics (Umami)

Setup procedure is in **First-time setup** above. This section is
reference for afterwards.

### Why self-hosted

Umami sets no cookies and stores no personal data, so the site needs no
consent banner — which is also why the contact page can say "no cookies"
and have it stay true.

### Events

Pageviews are automatic. Custom events are declared in
`app/lib/analytics.ts` and fired from the components that own them:

| Event              | Fired from         | Answers                                      |
| ------------------ | ------------------ | -------------------------------------------- |
| `project-outbound` | project case study | Which project pulls people through?          |
| `contact-start`    | contact form       | How many people begin the form?              |
| `contact-submit`   | contact form       | How many finish? (start − submit = drop-off) |
| `post-depth`       | blog post          | Do readers reach the end? (25/50/75/100)     |

---

## Rate limiting (optional)

`DATABASE_URL` makes the contact form's per-IP limits survive a deploy.
Without it they reset every time the container restarts.

Point it at the `glassdca` database created above, using Dokploy's
internal connection string:

    DATABASE_URL=postgresql://user:pass@host:5432/glassdca

The two tables are created on first use — there is no migration step, and
they are excluded from backups on purpose: they hold throttling state
only, and are rebuilt automatically.

---

## Email

Mail goes through an Office 365 Exchange connector restricted to the VPS
IP. That connector is for **transactional mail only** — the contact form.
Microsoft's terms exclude bulk and marketing mail from Exchange Online,
and its throughput limits are far below a newsletter send.

If a mailing list is ever added, it needs a separate bulk provider on its
own subdomain with its own DKIM key, so newsletter sending reputation
cannot affect the address clients use to reach you.
