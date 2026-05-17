# frozen_string_literal: true

class JsonWebToken
  class EncodeError < StandardError; end
  class DecodeError < StandardError; end

  ALGORITHM = "HS256"

  class << self
    def encode(payload)
      exp_hours = ENV.fetch("JWT_EXPIRATION_HOURS", "24").to_i
      merged = payload.deep_dup
      merged[:exp] ||= exp_hours.hours.from_now.to_i
      JWT.encode(merged, secret_key, ALGORITHM)
    end

    def decode(token)
      raise DecodeError, "Token is blank" if token.to_s.strip.empty?

      body, = JWT.decode(token, secret_key, true, { algorithm: ALGORITHM })
      body.with_indifferent_access
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      raise DecodeError, e.message
    end

    private

    def secret_key
      key = ENV["JWT_SECRET_KEY"].to_s
      raise EncodeError, "JWT_SECRET_KEY is not set" if key.strip.empty?

      key
    end
  end
end
