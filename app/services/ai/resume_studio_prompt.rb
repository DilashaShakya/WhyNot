# frozen_string_literal: true

module Ai
  module ResumeStudioPrompt
    module_function

    SYSTEM = <<~TXT.squish
      You are a senior technical resume editor helping candidates improve real CV text for a specific role.
      Return ONLY valid JSON matching the schema the user gives you. No markdown fences, no prose outside JSON.

      Ground rules (mandatory):
      - Never invent employers, titles, dates, team sizes, revenue, percentages, or technologies that are not clearly
        supported by the user's resume text and/or the job description excerpt provided.
      - If you suggest adding a metric, use coaching language ("Consider adding approximate scale…", "If accurate, quantify…")
        rather than fabricating numbers.
      - Prefer strong—but honest—action verbs, clearer technical specificity, ownership signals, and recruiter-scannable phrasing.
      - Keep tone professional and ATS-friendly: standard role names, avoid gimmicky hype.
      - If the input bullet is already strong, make incremental clarity improvements and explain briefly—do not pad with fiction.
    TXT

    def job_context(job_application)
      return "" if job_application.blank?

      title = [ job_application.job_title, job_application.company_name ].compact_blank.join(" · ")
      desc = job_application.job_description.to_s.truncate(12_000)
      <<~CTX.strip
        Target role (for tailoring context):
        #{title.presence || "Untitled role"}

        Job description excerpt:
        #{desc}
      CTX
    end

    def bullet_rewrite_user(resume_title:, bullet_text:, section_heading:, job_context:)
      <<~PROMPT.strip
        Task: Rewrite ONE resume bullet for stronger impact and clarity.

        Resume document title: #{resume_title}
        Section context (optional): #{section_heading.presence || "—"}

        #{job_context.presence || "No job description provided—optimize for general senior IC / engineering readability."}

        Original bullet (verbatim):
        #{bullet_text}

        Respond with JSON object only, keys:
        - "improved_bullet" (string, single line or tight clause stack recruiters can paste; no fabricated metrics)
        - "rationale" (string, 2-4 sentences: what improved and why)
        - "verification_prompts" (array of strings, 1-4 items: what the candidate should double-check for accuracy)
      PROMPT
    end

    def resume_writing_insights_user(resume_title:, resume_body:, job_context:)
      <<~PROMPT.strip
        Task: Score how well the FULL resume addresses important expectations. If a job description is provided, each row should reflect a concrete theme, skill, or requirement from that posting (paraphrased). If no job is provided, each row should reflect a strong resume-quality dimension (impact, clarity, technical depth, leadership, scope, ATS keywords, etc.) inferred from the resume itself.

        Resume document title: #{resume_title}

        #{job_context.presence || "No job description provided—derive 12-16 checklist items from the resume and from general senior-hire expectations. Still score honestly: do not invent experience the resume does not support."}

        Full resume text (ground truth; do not invent employers, dates, tools, or metrics not supported by this text):
        #{resume_body.truncate(18_000)}

        For each checklist item assign:
        - "status" exactly one of: "strong_match", "moderate_gap", "critical_gap"
          (critical_gap = missing or very weak signal in the resume; moderate_gap = mentioned but could be clearer/stronger; strong_match = clear, specific evidence)
        - "points_earned" and "points_possible" integers with points_possible between 3 and 20, and points_earned ≤ points_possible. Higher weight items for the role should use higher points_possible.
        - "importance_rank" integer 1 = most important item for the target (or for the resume overall if no job).

        Respond with JSON object only, keys:
        - "overview" (string, optional, 2-4 sentences big-picture)
        - "summary" (object with integer counts, must match your rows: "critical_gaps", "moderate_gaps", "strong_matches")
        - "match_items" (array of 12-16 objects, each with:
            "rank" (integer, display order 1..N after sorting by importance_rank),
            "importance_rank" (integer),
            "title" (string ≤100 chars, bold headline style),
            "description" (string, one sentence: what this expectation is / why it matters),
            "status" (string, one of the three above),
            "points_earned" (integer),
            "points_possible" (integer),
            "resume_evidence" (string, optional: short quote or paraphrase from resume, or "Not clearly evidenced" if gap),
            "coaching" (string, 1-2 sentences: why this score and what to fix),
            "rewrite_section" (object, required: practical edits—NOT a full fabricated CV)
                - "headline" (string, e.g. "Ways to strengthen this on your resume")
                - "bullets" (array of 3-6 strings: concrete actions, bullets, or clauses the candidate can paste/adapt; no fake metrics)
                - "example_snippets" (array of 1-3 objects with "label" string and "text" string: alternate pasteable lines; same facts as resume)
        )
        - "cross_cutting" (array of strings, optional)
        - "ats_readability_notes" (array of strings, optional)

        Ensure JSON is valid and numeric fields are numbers, not strings.
      PROMPT
    end

    def tailoring_user(resume_title:, resume_body:, job_application:)
      job_ctx = job_context(job_application)

      <<~PROMPT.strip
        Task: Tailor resume emphasis for THIS job—recommend what to foreground, not rewrite the whole resume in JSON.

        Resume document title: #{resume_title}

        Full resume text (may be long; use for grounding only, do not invent facts):
        #{resume_body.truncate(18_000)}

        #{job_ctx}

        Respond with JSON object only, keys:
        - "skills_to_emphasize" (array of objects with "skill" string and "why" string)
        - "projects_to_raise" (array of objects with "project_hint" string, "reason" string — refer to lines/projects actually in resume text)
        - "technologies_to_surface" (array of objects with "technology" string, "where" string suggesting placement)
        - "strongest_experience_alignment" (array of strings tying resume bullets/experience to job themes, without invention)
        - "executive_summary_angle" (string, 2-5 sentences: how to position the candidate honestly for this posting)
      PROMPT
    end

    def impact_scan_user(resume_title:, resume_body:, job_context:)
      <<~PROMPT.strip
        Task: Find weak bullets or lines that lack measurable impact, scale, ownership, or outcome language.
        Cite ONLY text that appears in the resume excerpt (short quotes). Suggest directions, not fake numbers.

        Resume document title: #{resume_title}

        #{job_context.presence || "No job description provided—use general engineering resume standards."}

        Resume text:
        #{resume_body.truncate(16_000)}

        Respond with JSON object only, keys:
        - "weak_bullets" (array of objects with:
            "excerpt" string (short quote from resume),
            "issue" string,
            "suggested_direction" string,
            "metric_prompt" string (coaching prompt, not a invented metric))
        Limit to at most 12 items; prioritize the weakest first.
      PROMPT
    end
  end
end
