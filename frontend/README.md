# WhyNot — Frontend

React SPA for [WhyNot](../README.md): pairs with the Rails API (`/api/v1`).

## Stack

- React 19 + TypeScript + **Vite 5**
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router 7
- Zustand + `persist` (JWT + user in `localStorage`)
- Axios (JSON, `Authorization` header)
- Framer Motion (subtle page and nav motion)

## Setup

```bash
cd frontend
npm install
npm run dev
```

(Optional: `cp .env.example .env` only if you need to change proxy target or set `VITE_API_URL`.)

Dev server: **http://localhost:5173** (strict port in `vite.config.ts`). Requests to **`/api`** are proxied to **`http://127.0.0.1:3002`** by default, so Rails should listen on port **3002** and you usually **do not** need `VITE_API_URL`. For production `npm run build`, set **`VITE_API_URL`** to your API. Rails **`CORS_ORIGINS`** must include **`http://localhost:5173`** if you set `VITE_API_URL` and call the API directly from the browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Auth notes

- JWT is stored under the `whynot-auth` persist key (Zustand). **SPAs cannot match true httpOnly cookie security**; production hardening usually means a BFF or backend issuing cookies—this client follows standard JWT-in-localStorage patterns for a Vite app.
- Before the first React render, `main.tsx` awaits `useAuthStore.persist.rehydrate()` so the initial route check sees the restored token (no extra loading component).
- Axios treats `401` on `/auth/login` or `/auth/register` as a normal failed sign-in (no logout). Any other `401` clears auth and sends the browser to `/login` (unless you are already on `/login` or `/register`).

## Resumes (PDF upload & preview)

- **`src/api/resumes.api.ts`** — `GET/POST` helpers; `createResume` sends `multipart/form-data` (Axios strips `Content-Type` for `FormData` in `client.ts`).
- **`src/pages/dashboard/ResumePage.tsx`** — list, drag-and-drop zone, upload progress, navigates to detail after success.
- **`src/pages/dashboard/ResumeDetailPage.tsx`** — parsed text in sectioned preview (`ParsedResumePreview`).
- **`src/components/resume/`** — `ResumeDropzone`, upload progress bar, list skeleton.

PDFs: client-side validation matches API (type + 5 MB max).

## Job comparison & analysis UI

- **`src/api/jobApplications.api.ts`** — list/show/create; `refreshJobAnalysis` posts to `analysis_result`.
- **`src/pages/dashboard/JobDescriptionPage.tsx`** — form (resume select, posting paste) and saved comparison list.
- **`src/pages/dashboard/JobComparisonPage.tsx`** — full structured dashboard for one application (`/app/job/:jobApplicationId`).
- **`src/pages/dashboard/AnalysisPage.tsx`** — grid of all comparisons with overlap summaries.
- **`src/components/analysis/`** — `OverlapBar`, `SkillGapMeter`, `SkillListCard`, `StructuredComparisonPanel`.

## AI rejection analysis (dashboard)

- **`src/api/aiRejection.api.ts`** — list/show/create AI runs (handles `202 Accepted`).
- **`src/components/ai/`** — `AiRejectionDashboard`, `AiRejectionDetailCard`, `FeedbackDisclosure`, `ConfidenceMeter`.

## Structure

```
src/
  api/           # Axios client, auth, resumes, job applications, error helpers
  components/    # layout, ui, resume, analysis, ai, feedback, auth guards
  hooks/         # useToast
  lib/           # utils (cn, resumePdf)
  pages/         # route-level screens
  routes/        # AppRoutes
  stores/        # auth, theme, toast
```

## Theming

Manual dark mode via `ThemeSync` + `.dark` on `document.documentElement`. Preference (`light` | `dark` | `system`) persists as `whynot-theme`.
