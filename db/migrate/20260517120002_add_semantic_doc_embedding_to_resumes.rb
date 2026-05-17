# frozen_string_literal: true

class AddSemanticDocEmbeddingToResumes < ActiveRecord::Migration[7.2]
  def change
    add_column :resumes, :semantic_doc_embedding, :jsonb
    add_column :resumes, :semantic_doc_fingerprint, :string
  end
end
