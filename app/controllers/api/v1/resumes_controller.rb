# frozen_string_literal: true

module Api
  module V1
    class ResumesController < AuthenticatedController
      before_action :set_resume, only: [ :show, :update, :destroy ]

      def index
        resumes = current_user.resumes.order(updated_at: :desc)
        render json: {
          resumes: resumes.map { |r| Api::V1::ResumeSerializer.new(r, detail: false).as_json }
        }, status: :ok
      end

      def show
        render json: { resume: Api::V1::ResumeSerializer.new(@resume, detail: true).as_json }, status: :ok
      end

      def create
        resume = current_user.resumes.new(resume_base_params)
        resume.file.attach(params.dig(:resume, :file)) if params.dig(:resume, :file).present?
        resume.save!
        Resumes::PdfTextExtractionService.call(resume) if resume.file.attached?
        render json: { resume: Api::V1::ResumeSerializer.new(resume.reload, detail: true).as_json }, status: :created
      end

      def update
        @resume.assign_attributes(resume_base_params)
        file_param = params.dig(:resume, :file)
        @resume.file.attach(file_param) if file_param.present?
        @resume.save!
        Resumes::PdfTextExtractionService.call(@resume) if file_param.present? && @resume.file.attached?
        render json: { resume: Api::V1::ResumeSerializer.new(@resume.reload, detail: true).as_json }, status: :ok
      end

      def destroy
        @resume.destroy!
        head :no_content
      end

      private

      def set_resume
        @resume = current_user.resumes.find(params[:id])
      end

      def resume_base_params
        params.require(:resume).permit(:title, :notes)
      end
    end
  end
end
