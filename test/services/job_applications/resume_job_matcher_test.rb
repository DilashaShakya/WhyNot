# frozen_string_literal: true

require "test_helper"

class JobApplications::ResumeJobMatcherTest < ActiveSupport::TestCase
  test "computes matching and missing skills" do
    job = "We need Ruby on Rails, PostgreSQL, React, and Kubernetes experience."
    resume = "Built APIs with Ruby on Rails and PostgreSQL; shipped React dashboards."

    result = JobApplications::ResumeJobMatcher.call(job_description: job, resume_text: resume)

    assert result["semantic_layer"].is_a?(Hash)
    assert_equal "disabled", result["semantic_layer"]["status"]

    slugs = result["matching_skills"].map { |h| h["slug"] }
    assert_includes slugs, "ruby_on_rails"
    assert_includes slugs, "react"

    missing = result["missing_skills"].map { |h| h["slug"] }
    assert_includes missing, "kubernetes"
  end

  test "keyword overlap present for overlapping copy" do
    job = "Craft resilient payment systems using structured logging and telemetry."
    resume = "Implemented payment workflows with telemetry and structured logging pipelines."

    result = JobApplications::ResumeJobMatcher.call(job_description: job, resume_text: resume)

    assert result["semantic_layer"].is_a?(Hash)

    overlap = result["keyword_overlap"]

    assert overlap["matched_term_count"].positive?
    assert overlap["coverage_percent"].positive?
  end
end
