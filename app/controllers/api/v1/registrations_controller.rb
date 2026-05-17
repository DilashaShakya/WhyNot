# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        user = User.new(user_params)
        user.save!
        render json: auth_payload(user), status: :created
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation, :display_name)
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
