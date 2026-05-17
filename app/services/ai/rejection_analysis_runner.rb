# frozen_string_literal: true

module Ai
  class RejectionAnalysisRunner
    def self.call(ai_rejection_analysis)
      new(ai_rejection_analysis).call
    end

    def initialize(ai_rejection_analysis)
      @record = ai_rejection_analysis
    end

    def call
      @record.update!(status: :processing, error_message: nil)

      job_application = @record.job_application
      resume = job_application.resume

      if resume.parsed_text.blank?
        fail_run!("Resume text is missing. Parse the PDF before generating AI feedback.")
        return
      end

      messages = RejectionAnalysisPrompt.build_messages(
        job_application: job_application,
        resume_excerpt: resume.parsed_text,
        job_excerpt: job_application.job_description
      )

      model = @record.model_id.presence || ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
      raw = ::OpenaiHttpClient.chat_json(messages: messages, model: model)
      parsed = parse_response(raw["content"])

      @record.update!(
        status: :completed,
        structured_feedback: parsed,
        confidence_by_section: {},
        overall_confidence: nil,
        openai_response_id: raw["id"],
        error_message: nil
      )
    rescue ::OpenaiHttpClient::ConfigurationError => e
      fail_run!(e.message)
    rescue ::OpenaiHttpClient::ApiError => e
      Rails.logger.warn("[Ai::RejectionAnalysisRunner] OpenAI error: #{e.message}")
      fail_run!("OpenAI error: #{e.message.truncate(500)}")
    rescue JSON::ParserError => e
      fail_run!("Could not parse AI response: #{e.message.truncate(200)}")
    rescue StandardError => e
      Rails.logger.error("[Ai::RejectionAnalysisRunner] #{e.class}: #{e.message}\n#{e.backtrace&.take(4)&.join("\n")}")
      fail_run!(e.message.truncate(10_000))
    end

    private

    def parse_response(content)
      payload = content.to_s.strip
      obj = JSON.parse(payload)
      return obj if obj.is_a?(Hash)

      {}
    rescue JSON::ParserError
      inner = payload[/\{[\s\S]*\}\s*\z/m] || payload
      result = JSON.parse(inner)
      result.is_a?(Hash) ? result : {}
    rescue JSON::ParserError
      {}
    end

    def fail_run!(message)
      @record.update_columns(
        status: AiRejectionAnalysis.statuses[:failed],
        error_message: message.to_s.truncate(10_000),
        updated_at: Time.current
      )
    end
  end
end
