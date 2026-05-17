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
          status: @job_application.status,
          created_at: @job_application.created_at&.iso8601,
          updated_at: @job_application.updated_at&.iso8601
        }

        if @detail
          base[:job_description] = @job_application.job_description
        else
          base[:job_description_preview] = preview_text(@job_application.job_description)
        end

        base
      end

      private

      def preview_text(text)
        str = text.to_s.strip
        return "" if str.blank?

        str.length <= PREVIEW_LENGTH ? str : "#{str[0, PREVIEW_LENGTH].strip}…"
      end
    end
  end
end
