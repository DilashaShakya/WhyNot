# frozen_string_literal: true

module JobApplications
  class RunStructuredComparison
    def self.call(job_application)
      new(job_application).call
    end

    def initialize(job_application)
      @job_application = job_application
    end

    def call
      result = AnalysisResult.find_or_initialize_by(job_application: @job_application)
      resume = @job_application.resume

      if resume.parsed_text.blank?
        payload = base_error_payload("missing_parsed_resume")
        result.assign_attributes(
          status: :failed,
          summary: "Upload a PDF resume and wait for parsing before comparison can run.",
          structured_feedback: payload,
          error_message: resume.parse_error.presence || "Resume text is not available yet."
        )
        result.save!
        @job_application.update!(status: :failed)
        return result
      end

      comparison = ResumeJobMatcher.call(
        job_description: @job_application.job_description,
        resume_text: resume.parsed_text,
        resume: resume,
        job_application: @job_application
      )

      result.assign_attributes(
        status: :completed,
        summary: build_summary(comparison),
        structured_feedback: comparison,
        error_message: nil
      )
      result.save!

      @job_application.update!(status: :analysis_completed)
      result
    end

    private

    def base_error_payload(code)
      {
        "version" => 1,
        "engine" => "skill_lexicon_v1",
        "error_code" => code,
        "generated_at" => Time.current.utc.iso8601,
        "matching_skills" => [],
        "missing_skills" => [],
        "extra_resume_skills" => [],
        "keyword_overlap" => {
          "job_term_count" => 0,
          "resume_term_count" => 0,
          "matched_term_count" => 0,
          "coverage_percent" => 0.0,
          "resume_keyword_coverage_percent" => 0.0,
          "matched_terms_sample" => []
        },
        "experience_alignment" => {
          "score" => 0,
          "signals" => []
        }
      }
    end

    def build_summary(comparison)
      overlap = comparison["keyword_overlap"] || {}
      match_count = comparison["matching_skills"]&.size || 0
      missing_count = comparison["missing_skills"]&.size || 0
      coverage = overlap["coverage_percent"]
      align = comparison.dig("experience_alignment", "score")

      parts = []
      parts << "#{match_count} aligned skills"
      parts << "#{missing_count} job skills not surfaced in the resume" if missing_count.positive?
      parts << "#{coverage}% keyword coverage" if coverage
      parts << "experience fit score #{align}/100" if align

      sem = comparison["semantic_layer"]
      if sem.is_a?(Hash) && sem["status"] == "active" && sem["blended_fit_score"].present?
        parts << "semantic fit #{sem['blended_fit_score']}/100"
      end

      parts.join(" · ")
    end
  end
end
