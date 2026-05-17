# frozen_string_literal: true

class CreateResumeStudioTables < ActiveRecord::Migration[7.2]
  def change
    create_table :resume_studio_versions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :resume, null: false, foreign_key: true
      t.references :job_application, null: true, foreign_key: { on_delete: :nullify }
      t.text :body_text, null: false
      t.string :label, null: false, default: "Snapshot"
      t.string :source, null: false, default: "manual"
      t.timestamps
    end

    add_index :resume_studio_versions, [ :resume_id, :created_at ], order: { created_at: :desc },
              name: "index_resume_studio_versions_on_resume_and_created"

    create_table :resume_studio_rewrites do |t|
      t.references :user, null: false, foreign_key: true
      t.references :resume, null: false, foreign_key: true
      t.references :job_application, null: true, foreign_key: { on_delete: :nullify }
      t.string :prompt_kind, null: false
      t.jsonb :input, null: false, default: {}
      t.jsonb :output, null: false, default: {}
      t.timestamps
    end

    add_index :resume_studio_rewrites, [ :resume_id, :created_at ], order: { created_at: :desc },
              name: "index_resume_studio_rewrites_on_resume_and_created"
    add_index :resume_studio_rewrites, :prompt_kind
  end
end
