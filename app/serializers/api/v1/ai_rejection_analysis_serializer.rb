# frozen_string_literal: true

module Api
  module V1
    class AiRejectionAnalysisSerializer
      PREVIEW_LENGTH = 220

      def initialize(record, detail: true)
        @record = record
        @detail = detail
      end

      def as_json(*)
        base = {
          id: @record.id,
          job_application_id: @record.job_application_id,
          status: enum_db_name(AiRejectionAnalysis, @record, :status),
          overall_confidence: @record.overall_confidence,
          model_id: @record.model_id,
          prompt_version: @record.prompt_version,
          created_at: @record.created_at&.iso8601,
          updated_at: @record.updated_at&.iso8601
        }

        if @detail
          base[:structured_feedback] = @record.structured_feedback
          base[:confidence_by_section] = @record.confidence_by_section
          base[:error_message] = @record.error_message
          base[:openai_response_id] = @record.openai_response_id
        else
          fb = @record.structured_feedback
          fb = {} unless fb.is_a?(Hash)
          summary = fb["executive_summary"].to_s
          base[:executive_preview] =
            summary.present? && summary.length > PREVIEW_LENGTH ? "#{summary[0, PREVIEW_LENGTH].strip}…" : summary
          failed_raw = AiRejectionAnalysis.defined_enums.fetch("status", {}).fetch("failed", nil)
          raw = @record.read_attribute_before_type_cast(:status)
          base[:error_message] = @record.error_message if failed_raw && raw == failed_raw
        end

        base
      end

      private

      def enum_db_name(model, record, attr)
        map = model.defined_enums[attr.to_s] || {}
        raw = record.read_attribute_before_type_cast(attr)
        map.key(raw) || "unknown"
      end
    end
  end
end
