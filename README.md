# SmartMovess Consulting Zone

Recruitment and career-consulting website built from the SmartMovess Figma design.

**Stack:** Next.js (App Router) · TypeScript · React · Tailwind CSS v4 · Nodemailer (SMTP) · Zod · Lucide icons.
No Docker, no Redux, no extra services.

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in the SMTP_* values
npm run dev                     # http://localhost:3000
```

Form entries are not stored in a database: each submission is emailed to `NOTIFY_EMAIL`
(default `info@smartmovess.co.in`) with the form name in the subject. SMTP must be configured.

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` / `SMTP_PORT` | Mail server (e.g. `smtp.gmail.com` / `465`) |
| `SMTP_USER` / `SMTP_PASS` | Mailbox login (for Gmail/Google Workspace use an App Password) |
| `MAIL_FROM` | Sender shown on the notification email |
| `NOTIFY_EMAIL` | Where entries are delivered |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for sitemap, canonical URLs and Open Graph |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (validation schemas) |
| `npm run test:e2e` | Playwright journeys on desktop (1440) and mobile (390). Needs SMTP configured; **sends real emails** using `@example.com` addresses |

## Pages

| Route | Figma frame |
| --- | --- |
| `/` | 01 — Home |
| `/for-employers` | 02 — For Employers (includes hiring inquiry form) |
| `/for-candidates` | 03 — For Candidates |
| `/services` | 04 — Services & Pricing |
| `/contact` | 05 — Contact & Booking (message form + booking form) |
| `/internship` | 06A — Internship Program (+ enrollment popup 06B) |
| `/internship/enrolled` | 06C — Enrollment success |
| `/instagram-audit` | 07A — Instagram Audit (+ inquiry popup 07B) |
| `/instagram-audit/submitted` | 07C — Audit request success |

## Forms and data

Every form validates on the client and again on the server with the same Zod schema (`lib/validations.ts`).

| Form | Endpoint | Collection |
| --- | --- | --- |
| Internship enrollment (popup) | `POST /api/internship` | `internshipapplications` |
| Instagram audit inquiry (popup) | `POST /api/instagram-audit` | `instagramauditrequests` |
| Hiring requirements | `POST /api/hiring` | `employerinquiries` |
| Contact message | `POST /api/contact` | `contactmessages` |
| Consultation booking | `POST /api/booking` | `consultationbookings` |

All records carry `createdAt`/`updatedAt` and a `status` (`new`, `in_review`, `contacted`, `completed`, `rejected`).

Behaviour shared by every endpoint (`lib/handle-submission.ts`):

- Rate limit: 5 requests per minute per IP per endpoint → `429`.
- Hidden honeypot field: bot submissions return success and store nothing.
- Duplicate guard: the same person submitting the same request within 24 hours → `409` with a friendly message.
- Validation failures → `422` with per-field messages; database errors are logged server-side and never leaked.
- The submit button is disabled while a request is in flight, so double-clicks cannot create duplicates.

## Project structure

```
app/                     routes, API route handlers, sitemap, robots
components/layout/       Header, Footer
components/sections/     Hero, shared cards/steps/banners, FAQ, page-specific visuals
components/forms/        field primitives, useForm hook, the five forms
components/modals/       Modal (bottom sheet on mobile) + provider
components/ui/           Button, Logo, section primitives, icons
lib/                     site content, zod schemas, mailer, submission handler
tests/                   unit (Vitest) and e2e (Playwright)
public/images/           photography exported from Figma
```

## Deploying

The app is a standard Next.js app and deploys to Vercel or any Node host.

1. In the host's environment settings set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `NOTIFY_EMAIL` and `NEXT_PUBLIC_SITE_URL`.
2. Redeploy after changing environment variables.
3. Build with `npm run build`, start with `npm start` (Vercel does this automatically).

Notes: `next/font` downloads Manrope and Inter at build time, so the build machine needs internet access. The rate limiter is in-memory per server instance; if you scale out or run serverless at high volume, back it with a shared store (e.g. Redis/Upstash).

## Content still to be supplied by the client

These come straight from the Figma file as placeholders and need real values before launch:

- Footer email, phone, office address and social links (shown as "(placeholder)").
- Testimonials on the home page (the design itself labels them as placeholder content).
- Internship batch start dates and the list of internship domains / batches (currently "To be announced", plus a plausible domain list).
- Instagram audit "Primary goal" options (the design shows one example option; the rest are suggestions).
- Descriptions under "Who can apply" and "Who is this service for?" (the design prefixes them with "Placeholder description:"; the prefix was dropped, the wording is unchanged).
