# WhyNot — AI-Powered Resume Intelligence Platform

WhyNot is an AI-powered career feedback and resume optimization platform designed to help users understand why a resume may not align with a specific role — and how to improve it.

Instead of providing generic ATS scores or surface-level analytics, WhyNot delivers recruiter-style feedback grounded in the actual resume and job description. Users can upload resumes, compare them against job postings, receive actionable insights, and improve resume content through an integrated optimization workspace.

The platform focuses on practical career intelligence:

* identifying missing technologies and weak positioning
* surfacing strengths and transferable experience
* improving technical phrasing and resume language
* generating stronger, recruiter-oriented bullet points
* helping users tailor resumes toward specific engineering roles

## Core Features

* PDF resume upload and parsing
* Job description comparison workflows
* AI-generated recruiter-style rejection insights
* Resume strengths and weakness analysis
* Missing keyword and skill detection
* Resume Optimization Studio with editable rewrite suggestions
* Before/after bullet point improvements
* Downloadable optimized resume workflows
* Persistent analysis history and saved resume iterations

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

### Backend

* Ruby on Rails API
* PostgreSQL

### AI Integration

* OpenAI API

### Infrastructure

* Docker
* JWT Authentication

## Design Philosophy

WhyNot was intentionally designed with a minimal, distraction-free interface inspired by modern productivity tools like Notion and Linear.

The focus is not on overwhelming users with analytics dashboards, but on delivering:

* clear actionable insights
* calm UX
* meaningful resume improvements
* recruiter-oriented feedback

## Why This Project Exists

Many resume tools stop at keyword scoring or generic AI responses.

WhyNot was built to approach resume feedback more like an experienced recruiter or engineering hiring manager:

* identifying positioning issues
* recognizing missing technical emphasis
* suggesting stronger technical communication
* helping candidates better represent their actual experience

The goal is not to exaggerate resumes, but to help users communicate their skills more effectively and align resumes more intentionally with specific roles.

## Quick Start

1. Copy env and add your OpenAI key (required for AI features):

   ```bash
   cp .env.example .env
   ```

   Set `OPENAI_API_KEY` in `.env`.

2. Start the API and database:

   ```bash
   docker compose up
   ```

   API: http://localhost:3002 (health: http://localhost:3002/up)

3. Start the UI (new terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   App: http://localhost:5173

Sign up in the app, upload a PDF resume, create a job review, then use **Generate feedback** on the review page.

## Environment

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | AI feedback and studio |
| `JWT_SECRET_KEY` | Auth tokens (use a real secret in production) |
| `CORS_ORIGINS` | Allowed frontend URLs |

See `.env.example` for more options.

## Tests

```bash
RAILS_ENV=test JWT_SECRET_KEY=test_jwt_secret bin/rails db:test:prepare test
```

## Local API Without Docker

```bash
bundle install
bin/rails db:prepare
bin/rails server -b 0.0.0.0 -p 3002
```

Run the frontend steps above. The dev server proxies `/api` to port 3002.

## Future Improvements

* Inline PDF editing
* Multi-role resume tailoring
* Saved recruiter feedback history
* Personalized improvement tracking
* AI-assisted resume section generation
* Resume version comparison workflows
