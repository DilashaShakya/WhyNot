# frozen_string_literal: true

class JobApplication < ApplicationRecord
  belongs_to :user
  belongs_to :resume

  has_many :ai_rejection_analyses, dependent: :destroy

  enum :status, {
    draft: 0,
    submitted: 1,
    analysis_pending: 2,
    analysis_completed: 3,
    failed: 4
  }, validate: true

  validates :job_description, presence: true, length: { maximum: 500_000 }
  validates :job_title, length: { maximum: 255 }, allow_blank: true
  validates :company_name, length: { maximum: 255 }, allow_blank: true
  validate :resume_owned_by_user

  private

  def resume_owned_by_user
    return if resume.blank? || user.blank?
    return if resume.user_id == user_id

    errors.add(:resume_id, "must belong to the current user")
  end
end
