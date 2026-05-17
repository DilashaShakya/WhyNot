# frozen_string_literal: true

require "test_helper"

class Api::V1::AiRejectionAnalysesTest < ActionDispatch::IntegrationTest
  setup do
    @previous_key = ENV["OPENAI_API_KEY"]
    ENV["OPENAI_API_KEY"] = "sk-test"

    @user = User.create!(
      email: "ai@example.com",
      password: "supersecret",
      password_confirmation: "supersecret"
    )
    @token = JsonWebToken.encode(sub: @user.id)

    @resume = Resume.create!(
      user: @user,
      title: "Backend CV",
      parsed_text: "Senior engineer with Rails, PostgreSQL, and background in payments."
    )

    @job = JobApplication.create!(
      user: @user,
      resume: @resume,
      job_title: "Staff Engineer",
      company_name: "Acme",
      job_description: "We need deep Kubernetes, Rails, and strong communication.",
      status: :analysis_completed
    )
  end

  teardown do
    if @previous_key.present?
      ENV["OPENAI_API_KEY"] = @previous_key
    else
      ENV.delete("OPENAI_API_KEY")
    end
  end

  test "create runs synchronously and returns analysis payload" do
    fake = lambda { |**|
      {
        "content" => {
          "executive_summary" => "Strong backend profile with room to surface Kubernetes.",
          "resume_strengths" => [ "Rails depth" ],
          "possible_rejection_factors" => [ "Missing Kubernetes evidence" ],
          "keyword_deficiencies" => [ "Kubernetes" ],
          "recruiter_observations" => [ "Payments background is relevant." ],
          "bullet_rewrites" => [],
          "prioritized_improvements" => [],
          "positioning_recommendations" => [ "Lead with platform work." ],
          "company_culture_notes" => []
        }.to_json,
        "id" => "chatcmpl-test",
        "model" => "gpt-4o-mini"
      }
    }

    with_stubbed_openai_chat_json(fake) do
      post api_v1_job_application_ai_rejection_analyses_path(@job),
        headers: { "Authorization" => "Bearer #{@token}" },
        as: :json

      assert_response :success
      body = JSON.parse(response.body)
      assert_equal "completed", body.dig("ai_rejection_analysis", "status")
      assert body.dig("ai_rejection_analysis", "structured_feedback", "executive_summary").present?
    end
  end

  test "create returns 503 without API key" do
    ENV.delete("OPENAI_API_KEY")

    post api_v1_job_application_ai_rejection_analyses_path(@job),
      headers: { "Authorization" => "Bearer #{@token}" },
      as: :json

    assert_response :service_unavailable
  end

  test "create returns 422 when resume text missing" do
    @resume.update!(parsed_text: nil)

    post api_v1_job_application_ai_rejection_analyses_path(@job),
      headers: { "Authorization" => "Bearer #{@token}" },
      as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal "precondition_failed", body.dig("errors", 0, "code")
  end

  private

  def with_stubbed_openai_chat_json(stub_impl)
    original = OpenaiHttpClient.method(:chat_json)
    OpenaiHttpClient.define_singleton_method(:chat_json, &stub_impl)
    yield
  ensure
    OpenaiHttpClient.define_singleton_method(:chat_json, original)
  end
end
