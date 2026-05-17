# frozen_string_literal: true

module Api
  module V1
    class JobApplicationSerializer
      PREVIEW_LENGTH = 280

      def initialize(job_application, detail: false)
        @job_application = job_application
        @detail = detail
      end

      def as_json(*)
        base = {
          id: @job_application.id,
          resume_id: @job_application.resume_id,
          job_title: @job_application.job_title,
          company_name: @job_application.company_name,
          status: enum_db_name(JobApplication, @job_application, :status),
          created_at: @job_application.created_at&.iso8601,
          updated_at: @job_application.updated_at&.iso8601
        }

        if @detail
          base[:job_description] = @job_application.job_description
          analysis = @job_application.analysis_result
          base[:analysis_result] =
            analysis ? Api::V1::AnalysisResultSerializer.new(analysis).as_json : nil
        else
          base[:job_description_preview] = preview_text(@job_application.job_description)
          base[:analysis_summary] = analysis_summary
        end

        base
      end

      private

      def preview_text(text)
        str = text.to_s.strip
        return "" if str.blank?

        str.length <= PREVIEW_LENGTH ? str : "#{str[0, PREVIEW_LENGTH].strip}…"
      end

      def analysis_summary
        result = @job_application.analysis_result
        return { "state" => "none" } if result.blank?

        state = enum_db_name(AnalysisResult, result, :status)
        failed_raw = AnalysisResult.defined_enums.fetch("status", {}).fetch("failed", nil)
        raw = result.read_attribute_before_type_cast(:status)

        if failed_raw && raw == failed_raw
          return {
            "state" => state,
            "error_message" => result.error_message
          }
        end

        feedback = result.structured_feedback
        feedback = {} unless feedback.is_a?(Hash)
        overlap = feedback["keyword_overlap"]
        overlap = {} unless overlap.is_a?(Hash)

        sem = feedback["semantic_layer"]
        sem = {} unless sem.is_a?(Hash)

        {
          "state" => state,
          "overlap_percent" => overlap["coverage_percent"],
          "matching_skill_count" => skills_size(feedback["matching_skills"]),
          "missing_skill_count" => skills_size(feedback["missing_skills"]),
          "alignment_score" => feedback.dig("experience_alignment", "score"),
          "semantic_blended_fit_score" => sem["blended_fit_score"],
          "semantic_document_score" => sem["semantic_document_score"],
          "semantic_status" => sem["status"]
        }
      end

      def enum_db_name(model, record, attr)
        map = model.defined_enums[attr.to_s] || {}
        raw = record.read_attribute_before_type_cast(attr)
        map.key(raw) || "unknown"
      end

      def skills_size(value)
        value.respond_to?(:size) ? value.size : nil
      end
    end
  end
end
