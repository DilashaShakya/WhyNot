# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

module Ai
  class RejectionAnalysisRunner
    def self.call(ai_rejection_analysis)
      new(ai_rejection_analysis).call
    end

    def initialize(ai_rejection_analysis)
      @record = ai_rejection_analysis
    end

    def call
      @record.with_lock do
        @record.reload
        return if @record.completed?

        @record.update!(status: :processing, error_message: nil)
      end

      job_application = @record.job_application
      resume = job_application.resume
      analysis = job_application.analysis_result

      if analysis.blank? || !analysis.completed?
        fail_run!("Run structured comparison first (analysis_result must be completed).")
        return
      end

      if resume.parsed_text.blank?
        fail_run!("Resume text is missing—parse the PDF before AI feedback.")
        return
      end

      structured = analysis.structured_feedback
      if structured.blank? || structured["error_code"].present?
        fail_run!("Structured comparison data is unavailable for AI analysis.")
        return
      end

      messages = RejectionAnalysisPrompt.build_messages(
        job_application: job_application,
        structured_comparison: structured,
        resume_excerpt: resume.parsed_text,
        job_excerpt: job_application.job_description
      )

      model = @record.model_id.presence || ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
      raw = OpenaiHttpClient.chat_json(messages: messages, model: model)
      parsed = RejectionFeedbackParser.call(raw["content"])
      sections = parsed["sections"] || {}
      feedback_payload = sections.merge("executive_summary" => parsed["executive_summary"])
      feedback_payload["prompt_schema_version"] = parsed["prompt_schema_version"] if parsed["prompt_schema_version"].present?

      RejectionFeedbackParser::STRATEGIST_PAYLOAD_KEYS.each do |key|
        feedback_payload[key] = parsed[key] if parsed.key?(key)
      end

      @record.update!(
        status: :completed,
        structured_feedback: feedback_payload,
        confidence_by_section: parsed["confidence_by_section"] || {},
        overall_confidence: parsed["overall_confidence"],
        openai_response_id: raw["id"],
        error_message: nil
      )
    rescue OpenaiHttpClient::ConfigurationError => e
      fail_run!(e.message)
    rescue OpenaiHttpClient::ApiError => e
      Rails.logger.warn("[Ai::RejectionAnalysisRunner] OpenAI error: #{e.message}")
      fail_run!("OpenAI error: #{e.message.truncate(500)}")
    rescue JSON::ParserError => e
      fail_run!("Could not parse AI response: #{e.message.truncate(200)}")
    rescue ArgumentError => e
      fail_run!(e.message.truncate(500))
    rescue StandardError => e
      Rails.logger.error("[Ai::RejectionAnalysisRunner] #{e.class}: #{e.message}\n#{e.backtrace&.take(6)&.join("\n")}")
      fail_run!(e.message.truncate(10_000))
    end

    private

    def fail_run!(message)
      msg = message.to_s.truncate(10_000)
      @record.update_columns(
        status: AiRejectionAnalysis.statuses[:failed],
        error_message: msg,
        updated_at: Time.current
      )
    end
  end
end
