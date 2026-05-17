# frozen_string_literal: true

require "test_helper"

class Api::V1::AuthTest < ActionDispatch::IntegrationTest
  test "register returns token and user" do
    assert_difference("User.count", 1) do
      post api_v1_auth_register_url,
        params: {
          user: {
            email: "founder@example.com",
            password: "supersecret",
            password_confirmation: "supersecret",
            display_name: "Founder"
          }
        },
        as: :json
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert body["token"].present?
    assert_equal "founder@example.com", body.dig("user", "email")
  end

  test "login returns token" do
    User.create!(
      email: "login@example.com",
      password: "supersecret",
      password_confirmation: "supersecret"
    )

    post api_v1_auth_login_url,
      params: { email: "login@example.com", password: "supersecret" },
      as: :json

    assert_response :ok
    body = JSON.parse(response.body)
    assert body["token"].present?
  end

  test "me requires Authorization header" do
    get api_v1_me_url, as: :json
    assert_response :unauthorized
  end

  test "me returns current user with bearer token" do
    user = User.create!(
      email: "me@example.com",
      password: "supersecret",
      password_confirmation: "supersecret"
    )
    token = JsonWebToken.encode(sub: user.id)

    get api_v1_me_url,
      headers: { "Authorization" => "Bearer #{token}" },
      as: :json

    assert_response :ok
    assert_equal "me@example.com", JSON.parse(response.body).dig("user", "email")
  end
end
