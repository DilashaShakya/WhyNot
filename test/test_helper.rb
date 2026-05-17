ENV["RAILS_ENV"] ||= "test"
# Semantic embeddings require Python + sentence-transformers; keep deterministic tests lexical-only.
ENV["WHYNOT_DISABLE_SEMANTIC_EMBEDDINGS"] = "1" unless ENV.key?("WHYNOT_DISABLE_SEMANTIC_EMBEDDINGS")
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Add more helper methods to be used by all tests here...
  end
end
