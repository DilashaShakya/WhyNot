# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

# Top-level so Ruby resolves Net::HTTP as ::Net::HTTP, never Ai::Net::HTTP.
class OpenaiHttpClient
  API_BASE = "https://api.openai.com/v1"
  DEFAULT_READ_TIMEOUT = Integer(ENV.fetch("OPENAI_HTTP_READ_TIMEOUT", "300"))
  DEFAULT_OPEN_TIMEOUT = Integer(ENV.fetch("OPENAI_HTTP_OPEN_TIMEOUT", "30"))
  MAX_RETRIES = Integer(ENV.fetch("OPENAI_MAX_RETRIES", "3"))
  DEFAULT_MAX_TOKENS = Integer(ENV.fetch("OPENAI_MAX_COMPLETION_TOKENS", "16384"))

  class Error < StandardError; end
  class ConfigurationError < Error; end
  class ApiError < Error
    attr_reader :status_code, :body

    def initialize(message, status_code: nil, body: nil)
      super(message)
      @status_code = status_code
      @body = body
    end
  end

  def self.chat_json(messages:, model:)
    api_key = ENV["OPENAI_API_KEY"]
    raise ConfigurationError, "OPENAI_API_KEY is not set" if api_key.blank?

    uri = ::URI.parse("#{API_BASE}/chat/completions")
    payload = {
      model: model,
      temperature: Float(ENV.fetch("OPENAI_TEMPERATURE", "0.35")),
      response_format: { type: "json_object" },
      messages: messages,
      max_tokens: DEFAULT_MAX_TOKENS
    }

    attempts = 0
    begin
      attempts += 1
      response = perform_request(uri, api_key, payload)
      handle_response!(response)
    rescue ::Net::OpenTimeout, ::Net::ReadTimeout => e
      raise ApiError.new(
        "OpenAI request timed out (#{e.class}). Increase OPENAI_HTTP_READ_TIMEOUT or use a faster model.",
        status_code: nil,
        body: nil
      )
    rescue ApiError => e
      raise if attempts >= MAX_RETRIES
      raise unless retryable?(e.status_code)

      sleep((2**(attempts - 1)) + rand * 0.25)
      retry
    end
  end

  def self.perform_request(uri, api_key, payload)
    http = ::Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = DEFAULT_OPEN_TIMEOUT
    http.read_timeout = DEFAULT_READ_TIMEOUT

    req = ::Net::HTTP::Post.new(uri)
    req["Authorization"] = "Bearer #{api_key}"
    req["Content-Type"] = "application/json"
    req.body = payload.to_json
    http.request(req)
  end
  private_class_method :perform_request

  def self.handle_response!(response)
    case response.code.to_i
    when 200
      data =
        begin
          JSON.parse(response.body)
        rescue JSON::ParserError
          raise ApiError.new("Invalid JSON from OpenAI", status_code: 200, body: response.body)
        end
      content = data.dig("choices", 0, "message", "content").to_s
      raise ApiError, "Empty completion content" if content.blank?

      { "content" => content, "id" => data["id"], "model" => data["model"] }
    when 401, 403
      raise ApiError.new("OpenAI authentication failed", status_code: response.code.to_i, body: response.body)
    when 429, 500, 502, 503, 504
      raise ApiError.new("OpenAI request failed (retryable #{response.code})", status_code: response.code.to_i, body: response.body)
    else
      raise ApiError.new("OpenAI request failed: #{response.code}", status_code: response.code.to_i, body: response.body)
    end
  end
  private_class_method :handle_response!

  def self.retryable?(code)
    [429, 500, 502, 503, 504].include?(code)
  end
  private_class_method :retryable?
end
