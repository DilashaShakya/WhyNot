# frozen_string_literal: true

class CreateAnalysisResults < ActiveRecord::Migration[7.2]
  def change
    create_table :analysis_results do |t|
      t.references :job_application, null: false, foreign_key: true, index: { unique: true }
      t.integer :status, null: false, default: 0
      t.text :summary
      t.jsonb :structured_feedback, null: false, default: {}
      t.text :error_message

      t.timestamps
    end

    add_index :analysis_results, :structured_feedback, using: :gin
  end
end
