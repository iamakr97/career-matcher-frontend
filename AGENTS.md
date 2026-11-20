# Career Matcher Frontend

## Scope and stack

This repository is the Career Matcher frontend. Use React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query. Do not add Zustand or Material UI. Do not copy the reference dashboard's branding, admin authentication, or API contracts.

## Source structure

- `src/components/`: UI components and future module interfaces. Keep route pages thin.
- `src/pages/`: route-level wrappers; use kebab-case file names.
- `src/router/`: route definitions using `createBrowserRouter`. Add public or private route groups only after their behavior is defined.
- `src/layout/`: app shells when a layout is needed. Authentication and dashboard shells are not defined yet.
- `src/services/`: `api.ts` owns the shared `fetchBaseQuery` transport only. Each backend domain owns a separate `createApi` instance and its endpoints in a module file, such as `questionApi.ts`.
- `src/store/`: `store.ts` registers each module API reducer and middleware once and exports `useAppDispatch` and `useAppSelector` with `RootState` and `AppDispatch`. Add client-state slices only when needed.
- `src/types/`: shared types and DTOs when real contracts are known. Do not invent response shapes. Question Explorer DTOs live in `src/types/question.ts`.

Shadcn/ui uses the Base UI + Nova preset. Keep generated primitives in `src/components/ui/`, shared helpers in `src/lib/`, and generated hooks in `src/hooks/`. Keep `components.json`, the root and app TypeScript aliases, and Vite's `@/` alias aligned with `src/`. Do not switch the preset to Radix.

Create other directories only for a concrete need. Use `@/` for imports from `src`. Prefer named, typed exports for services and state. Avoid `any`, unsafe casts, and TypeScript suppression. Follow the existing single-quote, no-semicolon formatting.

## API and routing

Configure `VITE_BE_API_URL` as the backend origin only, as documented in `.env.example`; `src/services/api.ts` appends `/api` exactly once. Keep question endpoints in `src/services/questionApi.ts`. Do not implement auth or token refresh before their contracts are specified. Keep route content in components and pages as wrappers. The current router has home, Question Explorer, assessment placeholder, and fallback routes; do not add placeholder product routes.

## UI and validation

Use Tailwind v4 utilities for styling. The home page stays minimal until product UI is requested. Keep accessibility and responsive behavior in mind when adding UI. Before changing architecture, inspect nearby files and keep changes scoped. Report changed files and checks actually run; do not claim validation that was not performed.
