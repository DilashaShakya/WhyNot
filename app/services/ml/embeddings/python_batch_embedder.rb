# frozen_string_literal: true

require "json"
require "open3"

module Ml
  module Embeddings
    # Invokes ml/python/embed_batch.py (sentence-transformers). Separated from scoring and AI narrative layers.
    class PythonBatchEmbedder
      SCRIPT_PATH = Rails.root.join("ml/python/embed_batch.py")

      class EmbeddingError < StandardError; end

      def self.python_executable
        ENV.fetch("WHYNOT_PYTHON", "python3")
      end

      def self.model_id
        ENV.fetch("WHYNOT_SENTENCE_TRANSFORMER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
      end

      def self.disabled?
        ENV["WHYNOT_DISABLE_SEMANTIC_EMBEDDINGS"].present?
      end

      def self.script_present?
        SCRIPT_PATH.exist?
      end

      def self.embed(texts:, model: nil)
        raise EmbeddingError, "semantic embeddings disabled" if disabled?
        raise EmbeddingError, "embed_batch.py missing at #{SCRIPT_PATH}" unless script_present?

        model ||= model_id
        payload = JSON.generate("model" => model, "texts" => texts.map(&:to_s))
        stdout, stderr, status = Open3.capture3(
          { "PYTHONUNBUFFERED" => "1" },
          python_executable,
          SCRIPT_PATH.to_s,
          stdin_data: payload
        )
        unless status.success?
          raise EmbeddingError, stderr.presence || "python embed_batch exited #{status.exitstatus}"
        end

        body = JSON.parse(stdout)
        if body["error"].present?
          raise EmbeddingError, body["error"].to_s
        end

        vectors = body["vectors"]
        raise EmbeddingError, "no vectors in response" unless vectors.is_a?(Array)

        vectors
      rescue JSON::ParserError => e
        raise EmbeddingError, "invalid json from embed_batch: #{e.message}"
      end
    end
  end
end
