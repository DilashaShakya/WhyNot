# frozen_string_literal: true

module Api
  module V1
    class JobApplicationsController < AuthenticatedController
      before_action :set_job_application, only: [ :show, :update, :destroy ]

      def index
        applications = current_user.job_applications.order(updated_at: :desc)
        render json: {
          job_applications: applications.map { |ja| Api::V1::JobApplicationSerializer.new(ja, detail: false).as_json }
        }, status: :ok
      end

      def show
        render json: {
          job_application: Api::V1::JobApplicationSerializer.new(@job_application, detail: true).as_json
        }, status: :ok
      end

      def create
        job_application = current_user.job_applications.build(job_application_params)
        job_application.save!
        render json: {
          job_application: Api::V1::JobApplicationSerializer.new(job_application, detail: true).as_json
        }, status: :created
      end

      def update
        @job_application.assign_attributes(job_application_params)
        @job_application.save!
        render json: {
          job_application: Api::V1::JobApplicationSerializer.new(@job_application, detail: true).as_json
        }, status: :ok
      end

      def destroy
        @job_application.destroy!
        head :no_content
      end

      private

      def set_job_application
        @job_application = current_user.job_applications.find(params[:id])
      end

      def job_application_params
        params.require(:job_application).permit(
          :resume_id,
          :job_title,
          :company_name,
          :job_description
        )
      end
    end
  end
end
