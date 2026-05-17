# frozen_string_literal: true

module JobApplications
  class ExperienceAlignment
    SENIORITY_TERMS = %w[senior staff principal lead director manager architect intern junior associate executive vp
                       head].freeze

    def self.call(job_text:, resume_text:)
      new(job_text:, resume_text:).build
    end

    def initialize(job_text:, resume_text:)
      @job_text = job_text.to_s.downcase
      @resume_text = resume_text.to_s.downcase
    end

    def build
      job_years = max_years_mentioned(@job_text)
      resume_years = max_years_mentioned(@resume_text)

      job_seniority = seniority_hits(@job_text)
      resume_seniority = seniority_hits(@resume_text)

      score = compute_score(job_years, resume_years, job_seniority, resume_seniority)
      signals = build_signals(job_years, resume_years, job_seniority, resume_seniority)

      {
        "score" => score.clamp(0, 100),
        "job_years_mentioned" => job_years,
        "resume_years_mentioned" => resume_years,
        "job_seniority_hits" => job_seniority,
        "resume_seniority_hits" => resume_seniority,
        "signals" => signals
      }
    end

    private

    def max_years_mentioned(text)
      years = text.scan(/(\d+)\+?\s*(?:\+|-)?\s*years?/).map { |m| m[0].to_i }
      years.empty? ? nil : years.max
    end

    def seniority_hits(text)
      SENIORITY_TERMS.select { |t| text.match?(/\b#{Regexp.escape(t)}\b/) }.uniq
    end

    def compute_score(job_years, resume_years, job_sen, res_sen)
      parts = []
      parts << years_component(job_years, resume_years)
      parts << seniority_component(job_sen, res_sen)
      parts.compact!

      return 50 if parts.empty?

      (parts.sum.to_f / parts.size).round
    end

    def years_component(job_years, resume_years)
      return nil if job_years.nil? && resume_years.nil?
      return 55 if job_years.nil?
      return 40 if resume_years.nil?

      if resume_years >= job_years
        85
      else
        ratio = resume_years.to_f / job_years
        (40 + ratio * 45).round
      end
    end

    def seniority_component(job_sen, res_sen)
      return nil if job_sen.empty? && res_sen.empty?

      overlap = (job_sen & res_sen).any?
      return 80 if overlap

      return 45 if job_sen.any? && res_sen.empty?
      return 60 if job_sen.empty? && res_sen.any?

      55
    end

    def build_signals(job_years, resume_years, job_sen, res_sen)
      signals = []

      if job_years && resume_years
        if resume_years >= job_years
          signals << {
            "kind" => "years",
            "tone" => "positive",
            "message" => "Resume cites #{resume_years}+ years of experience; posting mentions #{job_years}+."
          }
        else
          signals << {
            "kind" => "years",
            "tone" => "neutral",
            "message" => "Posting asks for #{job_years}+ years; resume highlights up to #{resume_years}—gap may matter for strict screens."
          }
        end
      elsif job_years && resume_years.nil?
        signals << {
          "kind" => "years",
          "tone" => "watch",
          "message" => "Job text references #{job_years}+ years; no clear year statement detected in resume (heuristic)."
        }
      end

      if (job_sen & res_sen).any?
        signals << {
          "kind" => "seniority",
          "tone" => "positive",
          "message" => "Overlapping seniority language (#{(job_sen & res_sen).take(3).join(', ')}) appears in both documents."
        }
      elsif job_sen.any? && res_sen.empty?
        signals << {
          "kind" => "seniority",
          "tone" => "watch",
          "message" => "Role emphasizes #{job_sen.take(3).join(', ')}; consider surfacing comparable scope in your resume if accurate."
        }
      end

      signals
    end
  end
end
