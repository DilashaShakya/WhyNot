# frozen_string_literal: true

class DropLegacyAnalysisAndSemanticColumns < ActiveRecord::Migration[7.2]
  def change
    drop_table :analysis_results, if_exists: true

    remove_column :resumes, :semantic_doc_embedding, :jsonb, if_exists: true
    remove_column :resumes, :semantic_doc_fingerprint, :string, if_exists: true
    remove_column :job_applications, :semantic_job_doc_embedding, :jsonb, if_exists: true
    remove_column :job_applications, :semantic_job_doc_fingerprint, :string, if_exists: true
  end
end
