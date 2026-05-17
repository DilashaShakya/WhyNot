# frozen_string_literal: true

class CreateJobApplications < ActiveRecord::Migration[7.2]
  def change
    create_table :job_applications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :resume, null: false, foreign_key: true
      t.string :job_title
      t.string :company_name
      t.text :job_description, null: false
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :job_applications, [ :user_id, :created_at ]
  end
end
