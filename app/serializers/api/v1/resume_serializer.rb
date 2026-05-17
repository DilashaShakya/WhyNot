# frozen_string_literal: true

module Api
  module V1
    class ResumeSerializer
      PREVIEW_LIMIT = 320

      def initialize(resume, detail: false)
        @resume = resume
        @detail = detail
      end

      def as_json(*)
        base = {
          id: @resume.id,
          title: @resume.title,
          notes: @resume.notes,
          file: file_meta,
          parsed_at: @resume.parsed_at&.iso8601,
          parse_error: @resume.parse_error,
          created_at: @resume.created_at.iso8601,
          updated_at: @resume.updated_at.iso8601
        }

        if @detail
          base[:parsed_text] = @resume.parsed_text
        elsif @resume.parsed_text.present?
          base[:parsed_preview] = "#{@resume.parsed_text[0, PREVIEW_LIMIT]}#{@resume.parsed_text.length > PREVIEW_LIMIT ? '…' : ''}"
        else
          base[:parsed_preview] = nil
        end

        base
      end

      private

      def file_meta
        file = @resume.file
        return nil unless file.attached?

        {
          filename: file.filename.to_s,
          byte_size: file.byte_size,
          content_type: file.content_type
        }
      end
    end
  end
end
