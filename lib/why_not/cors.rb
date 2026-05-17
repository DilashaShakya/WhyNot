# frozen_string_literal: true

module WhyNot
  module Cors
    module_function

    def origins
      raw = ENV.fetch("CORS_ORIGINS", "http://localhost:3002,http://localhost:5173,http://127.0.0.1:5173")
      list = raw.split(",").map { |o| o.strip }.reject(&:empty?)
      return list if list.any?

      [ "*" ]
    end
  end
end
