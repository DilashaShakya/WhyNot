# frozen_string_literal: true

module ApiErrorHandling
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
    rescue_from ActionController::ParameterMissing, with: :render_parameter_missing
    rescue_from ActionController::UnpermittedParameters, with: :render_bad_request
  end

  private

  def render_not_found(_exception)
    render json: {
      errors: [
        { code: "not_found", message: "The requested resource was not found" }
      ]
    }, status: :not_found
  end

  def render_record_invalid(exception)
    render_validation_errors(exception.record)
  end

  def render_validation_errors(record)
    errors = record.errors.map do |error|
      {
        field: error.attribute.to_s,
        code: error.type.to_s,
        message: error.full_message
      }
    end

    render json: { errors: errors }, status: :unprocessable_entity
  end

  def render_parameter_missing(exception)
    render json: {
      errors: [
        {
          field: exception.param.to_s,
          code: "missing_parameter",
          message: exception.message
        }
      ]
    }, status: :bad_request
  end

  def render_bad_request(exception)
    render json: {
      errors: [
        { code: "bad_request", message: exception.message }
      ]
    }, status: :bad_request
  end
end
