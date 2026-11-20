# Career Matcher Frontend

React, TypeScript, Vite, React Router, Tailwind CSS v4, Redux Toolkit, and RTK Query foundation for Career Matcher.

## Setup

The required packages are listed in `package.json`. Install them with `npm install` when ready.

Copy `.env.example` to `.env` and set `VITE_BE_API_URL` to the backend origin only, such as `http://localhost:5000`. The shared transport appends `/api` once. The backend port may differ if `PORT` is overridden. No question endpoints are defined yet, so the home page does not make requests.

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
- `src/services/api.ts` exports the shared `fetchBaseQuery` transport. Each domain defines its own `createApi`; `src/services/questionApi.ts` currently has no endpoints.
- `src/store/store.ts` registers `questionApi`'s reducer and middleware once and exports the typed Redux hooks.
- `src/layout/` is reserved for a real app shell; `src/types/common.ts` holds the backend response envelope, and future domain DTOs belong in `src/types/`.
