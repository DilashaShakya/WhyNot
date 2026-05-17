# frozen_string_literal: true

class ResumeStudioVersion < ApplicationRecord
  belongs_to :user
  belongs_to :resume
  belongs_to :job_application, optional: true

  validates :body_text, presence: true
  validates :label, presence: true, length: { maximum: 255 }
  validates :source, presence: true, length: { maximum: 64 }
  validate :job_matches_resume, if: -> { job_application.present? }

  private

  def job_matches_resume
    return if job_application.resume_id == resume_id

    errors.add(:job_application_id, "must use the same resume")
  end
end
