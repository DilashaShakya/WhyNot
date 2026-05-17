# frozen_string_literal: true

class AnalysisResult < ApplicationRecord
  belongs_to :job_application

  enum :status, {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3
  }, validate: true

  validates :summary, length: { maximum: 50_000 }, allow_nil: true
  validates :error_message, length: { maximum: 10_000 }, allow_nil: true
end
