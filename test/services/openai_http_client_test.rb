# frozen_string_literal: true

require "test_helper"

class OpenaiHttpClientTest < ActiveSupport::TestCase
  test "top-level client is loadable and not nested under Ai" do
    assert_equal OpenaiHttpClient, ::OpenaiHttpClient
    assert_equal OpenaiHttpClient, Ai::OpenaiHttpClient
  end
end
