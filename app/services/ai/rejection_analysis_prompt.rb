# frozen_string_literal: true

module Ai
  # Structured "resume strategist" prompt: actionable rewrites, recruiter voice, contextual gaps.
  # Output is validated/normalized by RejectionFeedbackParser.
  class RejectionAnalysisPrompt
    VERSION = "strategist_v2"

    MAX_RESUME_CHARS = 16_000
    MAX_JOB_CHARS = 10_000

    def self.build_messages(job_application:, structured_comparison:, resume_excerpt:, job_excerpt:)
      system = <<~SYSTEM.squish
        You are a senior technical recruiter and career strategist. Your job is to help the candidate improve THIS resume
        for THIS specific role—not generic advice. Sound human, observant, and practical. Every point must tie to concrete
        evidence in the RESUME or JOB sections below or to the STRUCTURED_MATCHER facts (skills, keywords, alignment signals).
        If you cannot ground a claim, omit it or say you lack evidence. Never invent employers, dates, or technologies
        not present in the inputs. Do not mention policies of the hiring company. Avoid filler ("leverage synergies").
        Prefer short paragraphs in string arrays; be specific. Output a single JSON object exactly matching the user's schema.
        No markdown fences, no commentary outside JSON.
      SYSTEM

      comparison_blob = JSON.generate(structured_comparison)

      user = <<~USER
        Return JSON with these keys:

        REQUIRED STRINGS / NUMBERS:
        - executive_summary: string, 3-5 sentences. Recruiter read: strongest hook, main gap, clearest win, what to fix first.
        - overall_confidence: integer 0-100 (confidence this advice fits THIS pair).

        - confidence_by_section: object mapping EACH of these keys to integer 0-100:
          recruiter_observations, bullet_rewrites, contextual_missing_skills, positioning_recommendations,
          impact_metrics_gaps, resume_strengths, prioritized_improvements

        VOLUME (critical—users need copy-paste rewrites; sparse output is unacceptable):
        - bullet_rewrites: include AT LEAST 8 items and up to 20. Scan RESUME_TEXT for EVERY bullet-like line
          (lines starting with "-", "•", "*", or sentence fragments under roles). Each improved_bullet MUST be a single
          ready-to-paste resume line (no meta-commentary, no quotes). Use strong verbs, concrete stack from resume/job,
          scope, and plausible metrics only when grounded. why_stronger: 2-4 sentences explaining recruiter impact.
        - prioritized_improvements: AT LEAST 10 items up to 20, sorted by impact for THIS posting. detail must say
          exactly what to change on the page (section + bullet theme), not generic advice.
        - recruiter_observations: AT LEAST 6 strings up to 12.
        - contextual_missing_skills: AT LEAST 6 objects up to 14 (cover matcher missing_skills + posting themes).
        - impact_metrics_gaps: AT LEAST 6 objects up to 14 tied to quoted resume excerpts.
        - positioning_recommendations: AT LEAST 5 strings up to 12.
        - resume_strengths: AT LEAST 4 strings up to 12.

        - recruiter_observations: string[] (min 6, max 12). Realistic screening-room observations; tie X in resume to Y in posting.

        - bullet_rewrites: array of objects (max 20). Each object EXACTLY:
          { "original_bullet": string (verbatim or tight paraphrase from resume text),
            "weakness_tags": string[] (max 6 tags e.g. "vague_verb", "missing_metric", "missing_stack", "no_scope"),
            "improved_bullet": string (FINAL LINE ONLY—candidate can paste into resume),
            "why_stronger": string (2-4 sentences: clarity, credibility, alignment to job themes) }

        - contextual_missing_skills: array of objects (max 14). Each object EXACTLY:
          { "skill_or_term": string,
            "why_it_matters": string (role outcome / team expectation),
            "where_in_job_posting": string (paraphrase passage or theme from job, no invention),
            "transferable_angle": string (how existing resume experience might relate, or "none obvious" if not),
            "how_to_surface": string (concrete resume edit: bullet, project, or section tweak) }

        - positioning_recommendations: string[] (max 12). Strategy: section order, emphasis, leadership/production/ML focus,
          tailoring narrative toward role archetype.

        - impact_metrics_gaps: array of objects (max 14). Each object EXACTLY:
          { "resume_excerpt": string (short quote from resume),
            "gap": string (what is missing: scale, metric, ownership, depth),
            "suggested_direction": string (how to add impact without fabricating numbers—use ranges only if reasonable) }

        - resume_strengths: string[] (max 12). Stand-out technical areas, projects, leadership, deployment/system signals,
          differentiators—specific to resume text.

        - prioritized_improvements: array of objects (max 20), sorted most important first. Each object EXACTLY:
          { "priority": string, one of "high", "medium", "low",
            "title": string (short imperative, e.g. "Rewrite API bullet with throughput + framework"),
            "detail": string (2-5 sentences: why + exactly what to write or reorder),
            "category": string, one of "bullets", "skills", "positioning", "metrics", "keywords", "structure", "other" }

        OPTIONAL LEGACY (fill with useful non-redundant bullets; max 12 each):
        - possible_rejection_factors, missing_skills, resume_weaknesses, suggested_improvements, strong_areas,
          recommended_next_steps, keyword_deficiencies, experience_mismatch_notes, project_alignment_notes,
          formatting_readability_notes: string[] (max 12 each), recruiter tone, non-redundant with prioritized_improvements.

        STRUCTURED_MATCHER (deterministic facts; use to stay grounded):
        #{comparison_blob}

        JOB_POSTING:
        Title: #{job_application.job_title.presence || "—"}
        Company: #{job_application.company_name.presence || "—"}
        """#{truncate(job_excerpt, MAX_JOB_CHARS)}"""

        RESUME_TEXT (parsed PDF / text):
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
