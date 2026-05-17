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
        unless @job_application.analysis_result&.completed?
          render json: {
            errors: [
              {
                code: "precondition_failed",
                message: "Complete structured matching first (refresh comparison if needed)."
              }
            ]
          }, status: :unprocessable_entity
          return
        end

        if ENV["OPENAI_API_KEY"].blank?
          render json: {
            errors: [
              {
                code: "service_unavailable",
                message: "AI feedback is not configured—set OPENAI_API_KEY on the server."
              }
            ]
          }, status: :service_unavailable
          return
        end

        record = @job_application.ai_rejection_analyses.create!(
          status: :pending,
          prompt_version: Ai::RejectionAnalysisPrompt::VERSION,
          model_id: ENV.fetch("OPENAI_MODEL", "gpt-4o-mini")
        )

        AiRejectionAnalysisJob.perform_later(record.id)

        render json: {
          ai_rejection_analysis: Api::V1::AiRejectionAnalysisSerializer.new(record.reload).as_json
        }, status: :accepted
      end

      private

      def set_job_application
        @job_application = current_user.job_applications.includes(:analysis_result, :resume).find(params[:job_application_id])
      end

      def set_ai_rejection_analysis
        @ai_rejection_analysis = @job_application.ai_rejection_analyses.find(params[:id])
      end
    end
  end
end
