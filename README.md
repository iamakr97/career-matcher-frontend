# Career Matcher Frontend

React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query frontend.

## Setup

Copy `.env.example` to `.env`. Set `VITE_BE_API_URL` to the actual backend HTTP(S) origin only; the shared transport appends `/api` once. Set `VITE_PSYCHOMETRIC_ALLOWED_AGE_GROUPS` to a JSON array containing the exact reviewed values supplied to the backend's `PSYCHOMETRIC_ALLOWED_AGE_GROUPS`. The example `[]` deliberately disables new registration. No public endpoint discovers this catalog. The backend must allow the trusted frontend origin and `Authorization` header through CORS. Use a trusted origin and TLS in production.

## Routes

- `/` is the minimal home page.
- `/questions` is the existing question review flow; its preview API and types are separate from the learner flow.
- `/assessment` registers or resumes one learner session in the same tab, shows issued single-choice questions, submits responses, and displays the backend HTML report when ready. It uses POST `/api/career-matcher/assessment`, GET `/api/career-matcher/assessment/:id`, POST `/api/career-matcher/assessment/:id/submit-response`, and GET `/api/career-matcher/assessment/:id/report`.

The assessment capability and identity are retained in `sessionStorage` for same-tab reload. At most one exact pending choice response is retained temporarily for uncertain-submit recovery. `sessionStorage` is accessible to scripts on the same origin, so this is not an account login, secure vault, or cross-device recovery mechanism. Losing the capability may permanently lose access. Registration and pending-submission retries are explicit; no background mutation is sent on reload.

Native CHC and PISA interaction controls are deferred to FE02 and FE03. Final backend provisioning, scientific form readiness, eligibility, approved rubric, consent, storage and release policy remain independent deployment requirements. The frontend does not establish scientific validity or a complete seven-model learner journey.

## Verification

```sh
npm run lint
npm run build
```
