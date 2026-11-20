# Career Matcher Frontend

## Scope and stack

This repository is the Career Matcher frontend. Use React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query. Do not add Zustand or Material UI. Do not copy the reference dashboard's branding, admin authentication, or API contracts.

## Source structure

- `src/components/`: UI components and future module interfaces. Keep route pages thin.
- `src/pages/`: route-level wrappers; use kebab-case file names.
- `src/router/`: route definitions using `createBrowserRouter`. Add public or private route groups only after their behavior is defined.
- `src/layout/`: app shells when a layout is needed. Authentication and dashboard shells are not defined yet.
- `src/services/`: the shared RTK Query `api` slice and future module services. Add endpoints with `api.injectEndpoints`.
- `src/store/`: Redux store, typed hooks, and future application-state slices. Register the shared API reducer and middleware once.
- `src/types/`: shared types and DTOs when real contracts are known. Do not invent response shapes.

Shadcn/ui uses the Base UI + Nova preset. Keep generated primitives in `src/components/ui/`, shared helpers in `src/lib/`, and generated hooks in `src/hooks/`. Keep `components.json`, the root and app TypeScript aliases, and Vite's `@/` alias aligned with `src/`. Do not switch the preset to Radix.

Create other directories only for a concrete need. Use `@/` for imports from `src`. Prefer named, typed exports for services and state. Avoid `any`, unsafe casts, and TypeScript suppression. Follow the existing single-quote, no-semicolon formatting.

## API and routing

Configure the backend base URL with `VITE_BE_API_URL` as documented in `.env.example`. Do not append an assumed API prefix, add endpoints, or implement auth or token refresh before their contracts are specified. Keep route content in components and pages as wrappers. The current router has only a home route and a fallback route; do not add placeholder product routes.

## UI and validation

Use Tailwind v4 utilities for styling. The home page stays minimal until product UI is requested. Keep accessibility and responsive behavior in mind when adding UI. Before changing architecture, inspect nearby files and keep changes scoped. Report changed files and checks actually run; do not claim validation that was not performed.
