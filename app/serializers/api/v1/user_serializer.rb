# frozen_string_literal: true

module Api
  module V1
    class UserSerializer
      def initialize(user)
        @user = user
      end

      def as_json(*)
        {
          id: @user.id,
          email: @user.email,
          display_name: @user.display_name,
          created_at: @user.created_at.iso8601,
          updated_at: @user.updated_at.iso8601
        }
      end
    end
  end
end
