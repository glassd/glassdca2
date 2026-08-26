# glassd.ca

Personal site and portfolio for David Glass. React Router 7 with SSR,
content from Sanity, deployed as a Docker image by Dokploy on a VPS.

Live at [glassd.ca](https://glassd.ca).

## Stack

| Piece     | Choice                                                      |
| --------- | ----------------------------------------------------------- |
| Framework | React Router 7 (SSR, not SPA mode)                          |
| Content   | Sanity — posts, projects, tags, site settings               |
| Styling   | Tailwind 4, with design tokens in `app/index.css`           |
| Runtime   | Bun for install and scripts; Node runs the built server     |
| Analytics | Self-hosted Umami, optional — see `deploy/README.md`        |
| Mail      | Nodemailer over an Office 365 connector, transactional only |

## Running it

Bun only. There is no `package-lock.json` and adding one will conflict
with `bun.lock`.

    bun install
    bun run dev

Serves on http://localhost:5173.

Copy `.env.example` to `.env` first. The site runs without any of it —
Sanity content will just be missing, the contact form will fail at the
send step, and no analytics will load.

### Scripts

| Command             | Does                                            |
| ------------------- | ----------------------------------------------- |
| `bun run dev`       | Dev server with HMR                             |
| `bun run typecheck` | Route typegen, then `tsc`                       |
| `bun run lint`      | ESLint                                          |
| `bun run test`      | Vitest                                          |
| `bun run build`     | Production build to `build/`                    |
| `bun run start`     | Serve a build                                   |
| `bun run format`    | Prettier, **writes** — use `format:check` in CI |

CI runs typecheck, lint, test and build on every push and pull request.
`build` is worth running locally before pushing: it is the only step that
catches a server-only module being imported into client code, which
typecheck and dev will both let through.

## Layout

    app/
      routes/          one file per route, registered in routes.ts
      components/sd/   shared chrome (nav, footer, background grid)
      lib/
        queries.server.ts   all GROQ lives here
        markdown.ts         remark/rehype plugin pipeline
        markdown-render.tsx react-markdown mapping, heading + figure numbering
        abuse.server.ts     contact form rate limiting and bot checks
        analytics.ts        Umami event wrapper, no-op when not loaded
        projects.ts         project types and status derivation
        seo.ts / site.ts    canonical URLs, site constants
    sanity-cms/        Sanity Studio, deployed separately
    deploy/            Umami compose and the server runbook

### Two things that surprise people

**Sanity Studio does not deploy with the site.** It goes to Sanity's own
hosting. After changing anything in `sanity-cms/schemaTypes/`, run
`bun run deploy` from `sanity-cms/` or the new fields will not appear in
the studio, even though the site is already querying them.

**Server-only modules cannot be imported from component code.** React
Router strips server code from `loader`, `action`, `headers` and
`middleware` only. Importing `queries.server.ts` at the top level of a
route component builds fine in dev and fails the production build. Shared
constants belong in `lib/site.ts`.

## Deployment

Dokploy builds from GitHub on push and runs the Dockerfile. Environment
variables are set in Dokploy, not in the image.

`deploy/README.md` has the full first-time setup: analytics, the database,
and the order to do things in.
