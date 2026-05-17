# frozen_string_literal: true

class AiRejectionAnalysisJob < ApplicationJob
  queue_as :default

  # Runs the OpenAI-backed recruiter feedback pipeline for a single history row.
  def perform(ai_rejection_analysis_id)
    record = AiRejectionAnalysis.find_by(id: ai_rejection_analysis_id)
    return if record.blank?

    Ai::RejectionAnalysisRunner.call(record)
  end
end
