# frozen_string_literal: true

require "tempfile"

module Resumes
  # Extracts plain text from an attached PDF (Active Storage) and persists it on the Resume.
  class PdfTextExtractionService
    class << self
      def call(resume)
        new(resume).call
      end
    end

    def initialize(resume)
      @resume = resume
    end

    def call
      unless @resume.file.attached?
        clear_parsed_fields
        return
      end

      blob = @resume.file.blob
      text = extract(blob)
      if text.blank?
        mark_failure("No readable text could be extracted from this PDF.")
      else
        @resume.update_columns(
          parsed_text: text,
          parse_error: nil,
          parsed_at: Time.current,
          updated_at: Time.current
        )
      end
    rescue StandardError => e
      Rails.logger.warn("[Resumes::PdfTextExtractionService] resume=#{@resume.id} #{e.class}: #{e.message}")
      mark_failure("Could not read PDF: #{e.message}".truncate(2000))
    end

    private

    def clear_parsed_fields
      @resume.update_columns(
        parsed_text: nil,
        parse_error: nil,
        parsed_at: nil,
        updated_at: Time.current
      )
    end

    def mark_failure(message)
      @resume.update_columns(
        parsed_text: nil,
        parse_error: message.to_s.truncate(2000),
        parsed_at: Time.current,
        updated_at: Time.current
      )
    end

    def extract(blob)
      Tempfile.create([ "resume-#{@resume.id}", ".pdf" ]) do |tmp|
        tmp.binmode
        tmp.write(blob.download)
        tmp.rewind
        reader = PDF::Reader.new(tmp.path)
        reader.pages.filter_map { |page| page.text.presence }.join("\n\n").strip
      end
    end
  end
end
