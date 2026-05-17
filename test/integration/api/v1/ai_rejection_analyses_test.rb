# frozen_string_literal: true

require "test_helper"

class Api::V1::AiRejectionAnalysesTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

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

    AnalysisResult.create!(
      job_application: @job,
      status: :completed,
      summary: "3 aligned skills",
      structured_feedback: sample_comparison
    )
  end

  teardown do
    if @previous_key.present?
      ENV["OPENAI_API_KEY"] = @previous_key
    else
      ENV.delete("OPENAI_API_KEY")
    end
  end

  test "create enqueues AI job and returns accepted" do
    assert_enqueued_with(job: AiRejectionAnalysisJob) do
      post api_v1_job_application_ai_rejection_analyses_path(@job),
        headers: { "Authorization" => "Bearer #{@token}" },
        as: :json
    end

    assert_response :accepted
    body = JSON.parse(response.body)
    assert_equal "pending", body.dig("ai_rejection_analysis", "status")
    assert AiRejectionAnalysis.exists?(body.dig("ai_rejection_analysis", "id"))
  end

  test "create returns 503 without API key" do
    ENV.delete("OPENAI_API_KEY")

    post api_v1_job_application_ai_rejection_analyses_path(@job),
      headers: { "Authorization" => "Bearer #{@token}" },
      as: :json

    assert_response :service_unavailable
  end

  test "create returns 422 when structured analysis incomplete" do
    @job.analysis_result.update!(status: :failed)

    post api_v1_job_application_ai_rejection_analyses_path(@job),
      headers: { "Authorization" => "Bearer #{@token}" },
      as: :json

    assert_response :unprocessable_entity
  end

  private

  def sample_comparison
    {
      "version" => 1,
      "engine" => "skill_lexicon_v1",
      "generated_at" => Time.current.utc.iso8601,
      "matching_skills" => [ { "slug" => "rails", "label" => "Rails" } ],
      "missing_skills" => [ { "slug" => "kubernetes", "label" => "Kubernetes" } ],
      "extra_resume_skills" => [],
      "keyword_overlap" => {
        "job_term_count" => 10,
        "resume_term_count" => 8,
        "matched_term_count" => 4,
        "coverage_percent" => 40.0,
        "resume_keyword_coverage_percent" => 50.0,
        "matched_terms_sample" => %w[payments rails]
      },
      "experience_alignment" => {
        "score" => 62,
        "signals" => []
      }
    }
  end
end
