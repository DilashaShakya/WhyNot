# frozen_string_literal: true

module Api
  module V1
    class AnalysisResultsController < AuthenticatedController
      before_action :set_job_application

      def show
        result = @job_application.analysis_result
        if result.blank?
          render json: {
            errors: [ { code: "not_found", message: "Analysis has not been generated yet" } ]
          }, status: :not_found
          return
        end

        render json: {
          analysis_result: Api::V1::AnalysisResultSerializer.new(result).as_json
        }, status: :ok
      end

      def create
        JobApplications::RunStructuredComparison.call(@job_application)
        result = @job_application.analysis_result

        render json: {
          analysis_result: Api::V1::AnalysisResultSerializer.new(result).as_json
        }, status: :ok
      end

      private

      def set_job_application
        @job_application = current_user.job_applications.includes(:analysis_result).find(params[:job_application_id])
      end
    end
  end
end
