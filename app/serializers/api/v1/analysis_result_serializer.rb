# frozen_string_literal: true

module Api
  module V1
    class AnalysisResultSerializer
      def initialize(analysis_result)
        @analysis_result = analysis_result
      end

      def as_json(*)
        {
          id: @analysis_result.id,
          job_application_id: @analysis_result.job_application_id,
          status: enum_db_name(AnalysisResult, @analysis_result, :status),
          summary: @analysis_result.summary,
          structured_feedback: @analysis_result.structured_feedback,
          error_message: @analysis_result.error_message,
          created_at: @analysis_result.created_at&.iso8601,
          updated_at: @analysis_result.updated_at&.iso8601
        }
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
