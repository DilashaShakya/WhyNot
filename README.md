# WhyNot

Targeted **resume improvement for a specific role**: deterministic skills/keywords, optional embeddings, and an **AI resume strategist** (bullet rewrites, recruiter observations, contextual gaps, positioning). React UI in `frontend/`.

## Stack

Rails 7.2 API, PostgreSQL, JWT auth, PDF parsing, optional OpenAI for the strategist workflow (`prompt_version: strategist_v1`), optional Python + [sentence-transformers](https://www.sbert.net/) for embeddings (see `ml/python/`).

## AI resume strategist

After a job application has a **completed** structured comparison, call **`POST /api/v1/job_applications/:id/ai_rejection_analyses`** (same endpoint as before). The job enqueues **`AiRejectionAnalysisJob`**, which uses **`Ai::RejectionAnalysisPrompt`** (version **`strategist_v1`**) and normalizes output via **`Ai::RejectionFeedbackParser`**.

**Stored in `ai_rejection_analyses.structured_feedback` (JSON):**

| Area | Keys (examples) |
| --- | --- |
| Narrative | `executive_summary`, `prompt_schema_version` |
| Actions | `prioritized_improvements[]` (`priority`, `title`, `detail`, `category`) |
| Bullets | `bullet_rewrites[]` (`original_bullet`, `weakness_tags`, `improved_bullet`, `why_stronger`) |
| Recruiter voice | `recruiter_observations[]` |
| Skills in context | `contextual_missing_skills[]` (`skill_or_term`, `why_it_matters`, `where_in_job_posting`, `transferable_angle`, `how_to_surface`) |
| Positioning | `positioning_recommendations[]`, `impact_metrics_gaps[]`, `resume_strengths[]` |
| Legacy lists | `possible_rejection_factors`, `missing_skills`, … (optional string arrays) |

**History:** each POST creates a new row; the UI lists prior runs so you can compare edits over time.

## Run the API

**Docker (simplest):** from the repo root:

```bash
docker compose up --build
```

API on **http://127.0.0.1:3002** or **http://localhost:3002** (`GET /up` for health). Use `.env` only if you need to override Compose defaults.

**Local (no Docker):** after `bundle install` and `bin/rails db:prepare`, start with an explicit port so it always matches the UI:

```bash
bin/rails server -b 0.0.0.0 -p 3002
```

**If the page won’t load:** open **`http://127.0.0.1:3002/up`** for the API, then **`http://localhost:5173`** for the UI (dev proxy). With Docker: `docker compose ps` and `docker compose logs web`.

## Frontend

```bash
cd frontend && npm install && npm run dev
```

Dev server **`http://localhost:5173`** proxies **`/api`** → **`http://127.0.0.1:3002`**, so start Rails on **3002** first; you normally **do not** set `VITE_API_URL`. Optional: **`frontend/.env`** — see **`frontend/.env.example`** (`VITE_PROXY_TARGET` or `VITE_API_URL`).

Production builds: set **`VITE_API_URL`** to your real API origin when you run **`npm run build`**.

## Configuration

| Concern | Notes |
| --- | --- |
| Database | `DATABASE_*` or `DATABASE_URL` — see `config/database.yml` |
| Auth | `JWT_SECRET_KEY` (required in production) |
| CORS | `CORS_ORIGINS` (comma-separated) |
| AI feedback | `OPENAI_API_KEY` on the server only — without it, structured analysis still works; AI routes return 503 |
| Embeddings | Optional: `pip install -r ml/python/requirements.txt`, `WHYNOT_PYTHON`, `WHYNOT_SENTENCE_TRANSFORMER_MODEL`; disable with `WHYNOT_DISABLE_SEMANTIC_EMBEDDINGS=1`. Default Compose image does not ship PyTorch — use host Python or a custom image for full semantic mode |

## Tests

```bash
RAILS_ENV=test JWT_SECRET_KEY=test_jwt_secret bin/rails db:test:prepare test
```

CI: Brakeman, RuboCop, and tests (`.github/workflows/ci.yml`).

## API (outline)

Base path **`/api/v1`**: register/login, `me`, resumes (incl. PDF upload), job applications (structured `analysis_result`), nested **`ai_rejection_analyses`** (resume strategist runs). Errors return JSON `{ "errors": [{ "message": "..." }] }`.
