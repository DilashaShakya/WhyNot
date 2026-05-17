# frozen_string_literal: true

class ResumeStudioRewrite < ApplicationRecord
  ALLOWED_KINDS = %w[bullet section tailoring impact writing_insights].freeze

  belongs_to :user
  belongs_to :resume
  belongs_to :job_application, optional: true

  validates :prompt_kind, presence: true, inclusion: { in: ALLOWED_KINDS }
  validate :job_matches_resume, if: -> { job_application.present? }

  private

  def job_matches_resume
    return if job_application.resume_id == resume_id

    errors.add(:job_application_id, "must use the same resume")
  end
end
