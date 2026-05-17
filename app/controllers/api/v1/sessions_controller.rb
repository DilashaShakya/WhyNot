# frozen_string_literal: true

module Api
  module V1
    class SessionsController < ApplicationController
      def create
        user = User.find_by(email: login_email)
        if user.nil? || !user.authenticate(login_password)
          render json: {
            errors: [ { code: "invalid_credentials", message: "Invalid email or password" } ]
          }, status: :unauthorized
          return
        end

        render json: auth_payload(user), status: :ok
      end

      private

      def login_email
        params.require(:email).to_s.strip.downcase
      end

      def login_password
        params.require(:password)
      end

      def auth_payload(user)
        {
          token: JsonWebToken.encode(sub: user.id),
          user: Api::V1::UserSerializer.new(user).as_json
        }
      end
    end
  end
end
