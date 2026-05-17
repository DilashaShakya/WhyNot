# frozen_string_literal: true

module Api
  module V1
    class AiRejectionAnalysesController < AuthenticatedController
      before_action :set_job_application
      before_action :set_ai_rejection_analysis, only: [ :show ]

      def index
        list = @job_application.ai_rejection_analyses.order(created_at: :desc)
        render json: {
          ai_rejection_analyses: list.map { |r| Api::V1::AiRejectionAnalysisSerializer.new(r, detail: false).as_json }
        }, status: :ok
      end

      def show
        render json: {
          ai_rejection_analysis: Api::V1::AiRejectionAnalysisSerializer.new(@ai_rejection_analysis).as_json
        }, status: :ok
      end

      def create
        if ENV["OPENAI_API_KEY"].blank?
          render json: {
            errors: [
              {
                code: "service_unavailable",
                message: "AI feedback requires OPENAI_API_KEY on the server."
              }
            ]
          }, status: :service_unavailable
          return
        end

        resume = @job_application.resume
        if resume.parsed_text.blank?
          render json: {
            errors: [
              {
                code: "precondition_failed",
                message: "Upload and parse a resume PDF before generating AI feedback."
              }
            ]
          }, status: :unprocessable_entity
          return
        end

        record = @job_application.ai_rejection_analyses.create!(
          status: :pending,
          prompt_version: Ai::RejectionAnalysisPrompt::VERSION,
          model_id: ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
        )

        Ai::RejectionAnalysisRunner.call(record)
        record.reload

        if record.failed?
          render json: {
            errors: [
              {
                code: "ai_failed",
                message: record.error_message.presence || "AI feedback could not be generated."
              }
            ],
            ai_rejection_analysis: Api::V1::AiRejectionAnalysisSerializer.new(record).as_json
          }, status: :unprocessable_entity
          return
        end

        render json: {
          ai_rejection_analysis: Api::V1::AiRejectionAnalysisSerializer.new(record).as_json
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          errors: [ { code: "validation_error", message: e.record.errors.full_messages.join(", ") } ]
        }, status: :unprocessable_entity
      end

      private

      def set_job_application
        @job_application = current_user.job_applications.includes(:resume).find(params[:job_application_id])
      end

      def set_ai_rejection_analysis
        @ai_rejection_analysis = @job_application.ai_rejection_analyses.find(params[:id])
      end
    end
  end
end
