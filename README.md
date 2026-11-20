# Career Matcher Frontend

React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query foundation for Career Matcher.

## Setup

The required packages are listed in `package.json`. Install them with `npm install` when ready.

Copy `.env.example` to `.env` and set `VITE_BE_API_URL` to the backend base URL once it is known. Include any required path prefix in that value. No API endpoints are defined yet, so the home page does not make requests.

## Validate

```sh
npm run build
npm run lint
npm run dev
```

Open `/` to see the project name. Open an unknown path such as `/missing` to see the fallback route.

## Architecture

- `src/main.tsx` wraps the app with Redux `Provider`.
- `src/App.tsx` mounts `RouterProvider` from `react-router`.
- `src/router/` owns routes; `src/pages/` contains thin route wrappers; `src/components/` contains UI.
- `src/services/api.ts` exports one shared RTK Query API slice. Future module services add endpoints with `api.injectEndpoints`.
- `src/store/store.ts` registers the API reducer and middleware; `src/store/hooks.ts` exports typed Redux hooks.
- `src/layout/` and `src/types/` are reserved for real layouts and shared DTOs when those are defined.
