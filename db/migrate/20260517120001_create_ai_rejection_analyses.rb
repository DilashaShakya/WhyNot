# frozen_string_literal: true

class CreateAiRejectionAnalyses < ActiveRecord::Migration[7.2]
  def change
    create_table :ai_rejection_analyses do |t|
      t.references :job_application, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.jsonb :structured_feedback, null: false, default: {}
      t.jsonb :confidence_by_section, null: false, default: {}
      t.integer :overall_confidence
      t.string :model_id
      t.string :prompt_version, null: false, default: "rejection_v1"
      t.text :error_message
      t.string :openai_response_id

      t.timestamps
    end

    add_index :ai_rejection_analyses, [ :job_application_id, :created_at ],
      name: "index_ai_rejection_on_job_app_id_and_created_at"
  end
end
