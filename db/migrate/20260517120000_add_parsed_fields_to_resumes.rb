# frozen_string_literal: true

class AddParsedFieldsToResumes < ActiveRecord::Migration[7.2]
  def change
    change_table :resumes, bulk: true do |t|
      t.text :parsed_text
      t.string :parse_error, limit: 2000
      t.datetime :parsed_at
    end
  end
end
