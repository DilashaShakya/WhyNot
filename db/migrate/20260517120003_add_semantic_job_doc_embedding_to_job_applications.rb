# frozen_string_literal: true

class AddSemanticJobDocEmbeddingToJobApplications < ActiveRecord::Migration[7.2]
  def change
    add_column :job_applications, :semantic_job_doc_embedding, :jsonb
    add_column :job_applications, :semantic_job_doc_fingerprint, :string
  end
end
