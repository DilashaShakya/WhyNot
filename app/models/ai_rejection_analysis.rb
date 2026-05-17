# frozen_string_literal: true

class AiRejectionAnalysis < ApplicationRecord
  belongs_to :job_application

  enum :status, {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3
  }, validate: true

  validates :prompt_version, presence: true, length: { maximum: 64 }
  validates :error_message, length: { maximum: 10_000 }, allow_nil: true
  validates :overall_confidence, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 },
                                 allow_nil: true
end
