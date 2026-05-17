# frozen_string_literal: true

module Api
  module V1
    module Resumes
      class StudioController < AuthenticatedController
        before_action :set_resume
        before_action :ensure_openai!, only: %i[bullet_rewrite writing_insights tailoring impact_scan]

        def show
          latest = @resume.resume_studio_versions.order(created_at: :desc).first
          render json: {
            studio: {
              resume_id: @resume.id,
              title: @resume.title,
              baseline_parsed_text: @resume.parsed_text,
              latest_version: latest ? serialize_version(latest) : nil
            }
          }, status: :ok
        end

        def versions
          rows = @resume.resume_studio_versions.order(created_at: :desc).limit(80)
          render json: { resume_studio_versions: rows.map { |v| serialize_version(v) } }, status: :ok
        end

        def save_version
          version = @resume.resume_studio_versions.create!(
            user: current_user,
            job_application: studio_job_optional,
            body_text: params.require(:body_text),
            label: params[:label].presence || "Snapshot",
            source: (params[:source].presence || "manual").to_s.strip[0, 64]
          )
          render json: { resume_studio_version: serialize_version(version) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: [ { code: "validation_error", message: e.record.errors.full_messages.join(", ") } ] },
                 status: :unprocessable_entity
        end

        def rewrites
          rows = @resume.resume_studio_rewrites.order(created_at: :desc).limit(100)
          render json: { resume_studio_rewrites: rows.map { |r| serialize_rewrite(r) } }, status: :ok
        end

        def bullet_rewrite
          out = Ai::ResumeStudioRunner.bullet_rewrite(
            resume: @resume,
            bullet_text: params.require(:bullet_text),
            section_heading: params[:section_heading],
            job_application: studio_job_optional
          )
          persist_rewrite!("bullet", bullet_input_params, out)
          render json: { result: public_result(out) }, status: :ok
        rescue ActionController::ParameterMissing => e
          render json: { errors: [ { code: "bad_request", message: e.message } ] }, status: :bad_request
        rescue Ai::ResumeStudioRunner::Error => e
          render json: { errors: [ { code: "ai_error", message: e.message } ] }, status: :unprocessable_entity
        rescue Ai::OpenaiHttpClient::ConfigurationError => e
          render json: { errors: [ { code: "service_unavailable", message: e.message } ] }, status: :service_unavailable
        rescue Ai::OpenaiHttpClient::ApiError => e
          Rails.logger.warn("[ResumeStudio] OpenAI: #{e.message}")
          render json: { errors: [ { code: "ai_error", message: e.message.truncate(400) } ] }, status: :bad_gateway
        rescue StandardError => e
          render_studio_server_error(e)
        end

        def writing_insights
          body = params.require(:resume_body)
          out = Ai::ResumeStudioRunner.writing_insights(
            resume: @resume,
            resume_body: body,
            job_application: studio_job_optional
          )
          persist_rewrite!("writing_insights", writing_insights_input_params(body), out)
          render json: { result: public_result(out) }, status: :ok
        rescue ActionController::ParameterMissing => e
          render json: { errors: [ { code: "bad_request", message: e.message } ] }, status: :bad_request
        rescue Ai::ResumeStudioRunner::Error => e
          render json: { errors: [ { code: "ai_error", message: e.message } ] }, status: :unprocessable_entity
        rescue Ai::OpenaiHttpClient::ConfigurationError => e
          render json: { errors: [ { code: "service_unavailable", message: e.message } ] }, status: :service_unavailable
        rescue Ai::OpenaiHttpClient::ApiError => e
          Rails.logger.warn("[ResumeStudio] OpenAI: #{e.message}")
          render json: { errors: [ { code: "ai_error", message: e.message.truncate(400) } ] }, status: :bad_gateway
        rescue StandardError => e
          render_studio_server_error(e)
        end

        def tailoring
          job = studio_job_required!
          out = Ai::ResumeStudioRunner.tailoring(
            resume: @resume,
            resume_body: params.require(:resume_body),
            job_application: job
          )
          persist_rewrite!("tailoring", { job_application_id: job.id, resume_body_char_count: params.require(:resume_body).length }, out)
          render json: { result: public_result(out) }, status: :ok
        rescue ActionController::ParameterMissing => e
          render json: { errors: [ { code: "bad_request", message: e.message } ] }, status: :bad_request
        rescue Ai::ResumeStudioRunner::Error => e
          render json: { errors: [ { code: "ai_error", message: e.message } ] }, status: :unprocessable_entity
        rescue Ai::OpenaiHttpClient::ConfigurationError => e
          render json: { errors: [ { code: "service_unavailable", message: e.message } ] }, status: :service_unavailable
        rescue Ai::OpenaiHttpClient::ApiError => e
          Rails.logger.warn("[ResumeStudio] OpenAI: #{e.message}")
          render json: { errors: [ { code: "ai_error", message: e.message.truncate(400) } ] }, status: :bad_gateway
        rescue StandardError => e
          render_studio_server_error(e)
        end

        def impact_scan
          out = Ai::ResumeStudioRunner.impact_scan(
            resume: @resume,
            resume_body: params.require(:resume_body),
            job_application: studio_job_optional
          )
          persist_rewrite!(
            "impact",
            { resume_body_char_count: params.require(:resume_body).length, job_application_id: params[:job_application_id] }.compact,
            out
          )
          render json: { result: public_result(out) }, status: :ok
        rescue ActionController::ParameterMissing => e
          render json: { errors: [ { code: "bad_request", message: e.message } ] }, status: :bad_request
        rescue Ai::ResumeStudioRunner::Error => e
          render json: { errors: [ { code: "ai_error", message: e.message } ] }, status: :unprocessable_entity
        rescue Ai::OpenaiHttpClient::ConfigurationError => e
          render json: { errors: [ { code: "service_unavailable", message: e.message } ] }, status: :service_unavailable
        rescue Ai::OpenaiHttpClient::ApiError => e
          Rails.logger.warn("[ResumeStudio] OpenAI: #{e.message}")
          render json: { errors: [ { code: "ai_error", message: e.message.truncate(400) } ] }, status: :bad_gateway
        rescue StandardError => e
          render_studio_server_error(e)
        end

        private

        def render_studio_server_error(error)
          Rails.logger.error(
            "[ResumeStudio] #{action_name}: #{error.class}: #{error.message}\n#{error.backtrace&.first(8)&.join("\n")}"
          )
          render json: {
            errors: [ { code: "server_error", message: error.message.to_s.truncate(400) } ]
          }, status: :internal_server_error
        end

        def set_resume
          @resume = current_user.resumes.find(params[:resume_id])
        end

        def ensure_openai!
          return if ENV["OPENAI_API_KEY"].present?

          render json: {
            errors: [
              {
                code: "service_unavailable",
                message: "Resume Studio requires OPENAI_API_KEY on the server."
              }
            ]
          }, status: :service_unavailable
        end

        # Optional job context; if ID is present it must belong to this resume.
        # Invalid IDs are ignored so studio actions still work when the UI has a stale job selection.
        def studio_job_optional
          id = params[:job_application_id].presence
          return nil if id.blank?

          job = current_user.job_applications.find_by(id: id)
          return nil if job.blank? || job.resume_id != @resume.id

          job
        end

        def studio_job_required!
          id = params.require(:job_application_id)
          job = current_user.job_applications.find_by(id: id)
          raise ActiveRecord::RecordNotFound if job.blank? || job.resume_id != @resume.id

          job
        end

        def bullet_input_params
          {
            bullet_text: params[:bullet_text],
            section_heading: params[:section_heading],
            job_application_id: params[:job_application_id]
          }.compact
        end

        def writing_insights_input_params(resume_body)
          {
            resume_body_char_count: resume_body.length,
            job_application_id: params[:job_application_id]
          }.compact
        end

        def persist_rewrite!(kind, input_hash, output_hash)
          output_hash = {} unless output_hash.is_a?(Hash)
          stripped = output_hash.except("openai_response_id", "openai_model")
          safe_out = json_safe_deep(stripped)
          @resume.resume_studio_rewrites.create!(
            user: current_user,
            job_application: studio_job_optional,
            prompt_kind: kind,
            input: json_safe_deep(input_hash || {}),
            output: safe_out
          )
        rescue ActiveRecord::RecordInvalid => e
          Rails.logger.error("[ResumeStudio] persist_rewrite #{kind}: #{e.record.errors.full_messages.join(', ')}")
        end

        def public_result(out)
          return {} unless out.is_a?(Hash)

          json_safe_deep(out.except("openai_response_id", "openai_model"))
        end

        def json_safe_deep(obj)
          case obj
          when Hash
            obj.each_with_object({}) do |(k, v), h|
              h[k.to_s] = json_safe_deep(v)
            end
          when Array
            obj.map { |v| json_safe_deep(v) }
          when Float
            (obj.nan? || obj.infinite?) ? 0 : obj
          when String
            s = obj.dup
            s = s.force_encoding(Encoding::UTF_8)
            s.valid_encoding? ? s : s.encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "?")
          when Numeric, TrueClass, FalseClass, NilClass
            obj
          else
            obj.to_s
          end
        end

        def serialize_version(v)
          {
            id: v.id,
            body_text: v.body_text,
            label: v.label,
            source: v.source,
            job_application_id: v.job_application_id,
            created_at: v.created_at.iso8601
          }
        end

        def serialize_rewrite(r)
          {
            id: r.id,
            prompt_kind: r.prompt_kind,
            input: r.input,
            output: r.output,
            job_application_id: r.job_application_id,
            created_at: r.created_at.iso8601
          }
        end
      end
    end
  end
end
