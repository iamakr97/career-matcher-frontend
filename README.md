# Career Matcher Frontend

React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query frontend.

## Setup

Set `VITE_BE_API_URL` to the actual backend HTTP(S) origin only; the shared transport appends `/api` once. The registration form offers five local age labels without an environment catalog. The backend decides eligibility and provisioning. The backend must allow the trusted frontend origin and `Authorization` header through CORS. Use a trusted origin and TLS in production.

## Routes

- `/` is the minimal home page.
- `/questions` is the existing question review flow; its preview API and types are separate from the learner flow.
- `/assessment` registers or resumes one learner session in the same tab, shows issued choice and public CHC performance steps, submits responses, and displays the backend HTML report when ready. It uses POST `/api/career-matcher/assessment`, GET `/api/career-matcher/assessment/:id`, POST `/api/career-matcher/assessment/:id/submit-response`, and GET `/api/career-matcher/assessment/:id/report`.

The assessment capability and identity are retained in `sessionStorage` for same-tab reload. At most one exact pending operation is retained temporarily for uncertain-submit recovery. `sessionStorage` is accessible to scripts on the same origin, so this is not an account login, secure vault, or cross-device recovery mechanism. Losing the capability may permanently lose access. Registration and pending-submission retries are explicit; no background mutation is sent on reload.

The backend owns model progress, readiness, and the HTML report. Manual backend and database provisioning remains external to this frontend. After provisioning, manually start an assessment with the existing button, answer issued tasks for a backend-configured RIASEC-only form if available, and confirm the report. Then check other enabled models only with reviewed backend data. No runtime assessment was executed as part of this source change.

CHC supports issued static choice, audio, visual memory, sequence memory, learn and retain, and timed fluency steps through the existing performance renderer where the backend provides a complete step contract. The current backend requires `practiceRound` for practice submissions but does not project it, and does not project `cellCount` or `omissionAllowed`; those steps stop safely when their public domain is missing. PISA now has typed contracts, a media step, and a native meaning roles editor with explicit draft and submit. The other thirteen variants remain unavailable in the learner UI: comic locked panels, paired visual layout, sign asset palette, poster template, paired space plan, social flow, timed allocation, resource return, causal pair, cloth experiment, general experiment, story revision, and investigation builder. The current backend also omits `pieceAssets` from the paired layout projection and an editable baseline scene for posters. Final backend provisioning, scientific form readiness, eligibility, approved rubric, consent, storage and release policy remain independent deployment requirements. The frontend does not establish scientific validity or a complete seven-model learner journey.

## Verification

```sh
npm run lint
npm run build
```
