# frozen_string_literal: true

module Ai
  class RejectionFeedbackParser
    SECTION_STRING_ARRAY_KEYS = %w[
      possible_rejection_factors
      missing_skills
      resume_weaknesses
      suggested_improvements
      strong_areas
      recommended_next_steps
      keyword_deficiencies
      experience_mismatch_notes
      project_alignment_notes
      formatting_readability_notes
    ].freeze

    STRATEGIST_CONFIDENCE_KEYS = %w[
      recruiter_observations
      bullet_rewrites
      contextual_missing_skills
      positioning_recommendations
      impact_metrics_gaps
      resume_strengths
      prioritized_improvements
    ].freeze

    STRATEGIST_PAYLOAD_KEYS = %w[
      bullet_rewrites
      recruiter_observations
      contextual_missing_skills
      positioning_recommendations
      impact_metrics_gaps
      resume_strengths
      prioritized_improvements
    ].freeze

    PRIORITY_VALUES = %w[high medium low].freeze
    CATEGORY_VALUES = %w[bullets skills positioning metrics keywords structure other].freeze

    def self.call(raw_content)
      text = strip_code_fences(raw_content)
      data = JSON.parse(text)
      data = data["feedback"] if data.is_a?(Hash) && data["feedback"].is_a?(Hash)

      raise ArgumentError, "Expected JSON object" unless data.is_a?(Hash)

      structured = {}
      SECTION_STRING_ARRAY_KEYS.each do |key|
        structured[key] = normalize_array(data[key], max: 12)
      end

      executive = data["executive_summary"].to_s.strip
      overall = normalize_int(data["overall_confidence"])
      overall = overall.clamp(0, 100) if overall

      confidence_by_section = {}
      raw_conf = data["confidence_by_section"]
      if raw_conf.is_a?(Hash)
        STRATEGIST_CONFIDENCE_KEYS.each do |key|
          next unless raw_conf.key?(key)

          v = normalize_int(raw_conf[key])
          confidence_by_section[key] = v.clamp(0, 100) if v
        end
      end

      out = {
        "executive_summary" => executive,
        "overall_confidence" => overall,
        "confidence_by_section" => confidence_by_section,
        "sections" => structured,
        "prompt_schema_version" => RejectionAnalysisPrompt::VERSION
      }

      STRATEGIST_PAYLOAD_KEYS.each do |key|
        out[key] = send("normalize_#{key}", data[key]) if respond_to?("normalize_#{key}", true)
      end

      out
    end

    def self.strip_code_fences(text)
      s = text.to_s.strip
      return s unless s.start_with?("```")

      s = s.sub(/\A```(?:json)?\s*/i, "")
      s = s.sub(/\s*```\z/, "")
      s.strip
    end

    def self.normalize_array(value, max: 24)
      return [] if value.nil?

      arr = value.is_a?(Array) ? value : [ value ]
      arr.map { |x| x.to_s.strip }.reject(&:blank?).first(max)
    end

    def self.normalize_int(value)
      return nil if value.nil?

      Integer(value)
    rescue ArgumentError, TypeError
      nil
    end

    def self.normalize_bullet_rewrites(value)
      return [] unless value.is_a?(Array)

      value.filter_map do |row|
        next unless row.is_a?(Hash)

        {
          "original_bullet" => row["original_bullet"].to_s.strip,
          "weakness_tags" => normalize_array(row["weakness_tags"], max: 5),
          "improved_bullet" => row["improved_bullet"].to_s.strip,
          "why_stronger" => row["why_stronger"].to_s.strip
        }
      end.reject { |h| h["original_bullet"].blank? && h["improved_bullet"].blank? }.first(20)
    end

    def self.normalize_recruiter_observations(value)
      normalize_array(value, max: 12)
    end

    def self.normalize_contextual_missing_skills(value)
      return [] unless value.is_a?(Array)

      value.filter_map do |row|
        next unless row.is_a?(Hash)

        {
          "skill_or_term" => row["skill_or_term"].to_s.strip,
          "why_it_matters" => row["why_it_matters"].to_s.strip,
          "where_in_job_posting" => row["where_in_job_posting"].to_s.strip,
          "transferable_angle" => row["transferable_angle"].to_s.strip,
          "how_to_surface" => row["how_to_surface"].to_s.strip
        }
      end.reject { |h| h["skill_or_term"].blank? }.first(14)
    end

    def self.normalize_positioning_recommendations(value)
      normalize_array(value, max: 12)
    end

    def self.normalize_impact_metrics_gaps(value)
      return [] unless value.is_a?(Array)

      value.filter_map do |row|
        next unless row.is_a?(Hash)

        {
          "resume_excerpt" => row["resume_excerpt"].to_s.strip,
          "gap" => row["gap"].to_s.strip,
          "suggested_direction" => row["suggested_direction"].to_s.strip
        }
      end.reject { |h| h["gap"].blank? && h["resume_excerpt"].blank? }.first(14)
    end

    def self.normalize_resume_strengths(value)
      normalize_array(value, max: 12)
    end

    def self.normalize_prioritized_improvements(value)
      return [] unless value.is_a?(Array)

      value.filter_map do |row|
        next unless row.is_a?(Hash)

        p = row["priority"].to_s.downcase
        p = "medium" unless PRIORITY_VALUES.include?(p)
        c = row["category"].to_s.downcase
        c = "other" unless CATEGORY_VALUES.include?(c)
        {
          "priority" => p,
          "title" => row["title"].to_s.strip,
          "detail" => row["detail"].to_s.strip,
          "category" => c
        }
      end.reject { |h| h["title"].blank? }.first(20)
    end
  end
end
