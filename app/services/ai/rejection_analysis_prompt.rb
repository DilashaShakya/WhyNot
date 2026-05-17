# frozen_string_literal: true

module Ai
  # Builds recruiter-style feedback prompt. Works directly from resume text + job description—
  # no external matching pipeline needed.
  class RejectionAnalysisPrompt
    VERSION = "recruiter_v3"

    MAX_RESUME_CHARS = 16_000
    MAX_JOB_CHARS = 10_000

    def self.build_messages(job_application:, resume_excerpt:, job_excerpt:)
      system = <<~SYSTEM.squish
        You are a senior technical recruiter and career strategist. Help the candidate improve THIS resume
        for THIS specific role. Sound human, observant, and practical. Ground every point in concrete evidence
        from the RESUME or JOB sections below. Never invent employers, dates, or technologies not present in the
        inputs. Avoid filler. Prefer specific, short paragraphs. Output a single JSON object exactly matching the
        schema below. No markdown fences, no commentary outside JSON.
      SYSTEM

      user = <<~USER
        Return JSON with EXACTLY these keys:

        - executive_summary: string (3-5 sentences). Recruiter read: strongest hook, main gap, clearest win, what to fix first.

        - resume_strengths: string[] (4-12 items). Stand-out technical areas, projects, differentiators specific to this resume.

        - possible_rejection_factors: string[] (4-10 items). Honest, specific reasons this resume might not advance for THIS role.

        - keyword_deficiencies: string[] (4-15 items). Technologies, tools, methodologies mentioned in the job but absent from the resume.

        - recruiter_observations: string[] (5-10 items). Realistic screening-room observations tying resume to this posting.

        - bullet_rewrites: array of objects (8-20 items). Scan resume for bullet-like lines. Each object EXACTLY:
          { "original_bullet": string (verbatim from resume),
            "weakness_tags": string[] (e.g. "vague_verb", "missing_metric", "missing_stack"),
            "improved_bullet": string (final paste-ready line, strong verb, scope, plausible metric if grounded),
            "why_stronger": string (1-2 sentences: clarity and recruiter impact) }

        - prioritized_improvements: array of objects (8-15 items), most impactful first. Each object EXACTLY:
          { "priority": "high" | "medium" | "low",
            "title": string (short imperative),
            "detail": string (2-3 sentences: why + exactly what to change),
            "category": "bullets" | "skills" | "positioning" | "metrics" | "keywords" | "structure" | "other" }

        - positioning_recommendations: string[] (4-10 items). Section order, emphasis, narrative toward this role.

        - company_culture_notes: string[] (3-8 items). Culture signals visible in the job posting (values, working style,
          team traits, mission language) and whether the candidate's resume language aligns with them. For each,
          say what the company appears to value AND whether the resume reflects it—with a concrete suggestion if not.

        JOB POSTING:
        Title: #{job_application.job_title.presence || "—"}
        Company: #{job_application.company_name.presence || "—"}
        """#{truncate(job_excerpt, MAX_JOB_CHARS)}"""

        RESUME TEXT:
        """#{truncate(resume_excerpt, MAX_RESUME_CHARS)}"""
      USER

      [
        { "role" => "system", "content" => system },
        { "role" => "user", "content" => user }
      ]
    end

    def self.truncate(text, max)
      str = text.to_s
      return str if str.length <= max

      "#{str[0, max]}\n\n[truncated]"
    end
  end
end
