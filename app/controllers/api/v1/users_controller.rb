# frozen_string_literal: true

module Api
  module V1
    class UsersController < AuthenticatedController
      def show
        render json: { user: Api::V1::UserSerializer.new(current_user).as_json }, status: :ok
      end
    end
  end
end
