# frozen_string_literal: true

module Api
  module V1
    class ApplicationController < ::ApplicationController
      include ApiErrorHandling
    end
  end
end
