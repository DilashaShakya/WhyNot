# frozen_string_literal: true

require "set"

module JobApplications
  # Lexicon + (optional) embedding similarity between parsed resume text and a job description.
  # Semantic layer is compute-only via ml/python; AI rejection narratives stay separate.
  class ResumeJobMatcher
    def self.call(job_description:, resume_text:, resume: nil, job_application: nil)
      new(job_description:, resume_text:, resume:, job_application:).compare
    end

    def initialize(job_description:, resume_text:, resume: nil, job_application: nil)
      @job_description = job_description.to_s
      @resume_text = resume_text.to_s
      @resume = resume
      @job_application = job_application
    end

    def compare
      job_skills = JobDescriptions::SkillExtractor.call(@job_description)
      resume_skills = JobDescriptions::SkillExtractor.call(@resume_text)

      job_skills_set = job_skills.to_set
      resume_skills_set = resume_skills.to_set

      matching = (job_skills_set & resume_skills_set).to_a.sort
      missing = (job_skills_set - resume_skills_set).to_a.sort
      extra = (resume_skills_set - job_skills_set).to_a.sort

      job_keywords = JobDescriptions::KeywordExtractor.call(@job_description)
      resume_keywords = JobDescriptions::KeywordExtractor.call(@resume_text)
      keyword_overlap = build_keyword_overlap(job_keywords, resume_keywords)

      alignment = ExperienceAlignment.call(job_text: @job_description, resume_text: @resume_text)

      base = {
        "version" => 1,
        "engine" => "skill_lexicon_v1",
        "generated_at" => Time.current.utc.iso8601,
        "job_skill_count" => job_skills.size,
        "resume_skill_count" => resume_skills.size,
        "matching_skills" => matching.map { |slug| skill_row(slug) },
        "missing_skills" => missing.map { |slug| skill_row(slug) },
        "extra_resume_skills" => extra.map { |slug| skill_row(slug) },
        "keyword_overlap" => keyword_overlap,
        "experience_alignment" => alignment
      }

      semantic = Ml::SemanticResumeJobAnalysis.call(
        job_description: @job_description,
        resume_text: @resume_text,
        resume: @resume,
        job_application: @job_application,
        lexical: base
      )
      base["semantic_layer"] = semantic
      base["engine"] = semantic["status"] == "active" ? "skill_lexicon_v1+semantic_v1" : "skill_lexicon_v1"
      base
    end

    private

    def skill_row(slug)
      {
        "slug" => slug,
        "label" => WhyNot::SkillLexicon.label_for(slug)
      }
    end

    def build_keyword_overlap(job_keywords, resume_keywords)
      job_set = job_keywords.to_set
      resume_set = resume_keywords.to_set
      matched = (job_set & resume_set).to_a.sort

      job_count = job_keywords.size
      resume_count = resume_keywords.size
      matched_count = matched.size

      coverage =
        if job_count.zero?
          0.0
        else
          (matched_count.to_f / job_count * 100).round(1)
        end

      resume_coverage =
        if resume_count.zero?
          0.0
        else
          (matched_count.to_f / resume_count * 100).round(1)
        end

      {
        "job_term_count" => job_count,
        "resume_term_count" => resume_count,
        "matched_term_count" => matched_count,
        "coverage_percent" => coverage,
        "resume_keyword_coverage_percent" => resume_coverage,
        "matched_terms_sample" => matched.first(24)
      }
    end
  end
end
