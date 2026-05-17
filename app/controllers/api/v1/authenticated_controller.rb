# frozen_string_literal: true

module Api
  module V1
    class AuthenticatedController < ApplicationController
      before_action :authenticate_with_jwt!

      attr_reader :current_user

      private

      def authenticate_with_jwt!
        payload = decode_bearer_token!
        @current_user = User.find(payload[:sub])
      rescue JsonWebToken::DecodeError => e
        render json: {
          errors: [ { code: "unauthorized", message: e.message } ]
        }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound
        render json: {
          errors: [ { code: "unauthorized", message: "Invalid or expired token" } ]
        }, status: :unauthorized
      end

      def decode_bearer_token!
        header = request.headers["Authorization"].to_s
        token = header.delete_prefix("Bearer ").strip
        JsonWebToken.decode(token)
      end
    end
  end
end
