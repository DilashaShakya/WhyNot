# frozen_string_literal: true

require "test_helper"

class Ai::RejectionFeedbackParserTest < ActiveSupport::TestCase
  test "parses JSON with section arrays and confidence" do
    json = <<~JSON
      {
        "executive_summary": "Solid backend fit but weak frontend signals.",
        "overall_confidence": 72,
        "confidence_by_section": {
          "recruiter_observations": 70,
          "bullet_rewrites": 75,
          "contextual_missing_skills": 80,
          "positioning_recommendations": 65,
          "impact_metrics_gaps": 70,
          "resume_strengths": 85,
          "prioritized_improvements": 78,
          "possible_rejection_factors": 70,
          "missing_skills": 80
        },
        "possible_rejection_factors": ["Limited cloud exposure for a principal role."],
        "missing_skills": ["Kubernetes operations"],
        "resume_weaknesses": ["Impact metrics sparse"],
        "suggested_improvements": ["Quantify latency wins"],
        "strong_areas": ["Clear ownership narrative"],
        "recommended_next_steps": ["Add production K8s example"],
        "keyword_deficiencies": ["Low overlap on observability terms"],
        "experience_mismatch_notes": ["Posting implies staff scope"],
        "project_alignment_notes": ["Payments work aligns"],
        "formatting_readability_notes": ["Dense bullet walls in mid-page"],
        "recruiter_observations": ["Strong backend story."],
        "bullet_rewrites": [
          {
            "original_bullet": "Worked on APIs",
            "weakness_tags": ["vague"],
            "improved_bullet": "Built REST APIs with Django",
            "why_stronger": "Adds stack + outcome shape."
          }
        ],
        "contextual_missing_skills": [
          {
            "skill_or_term": "K8s",
            "why_it_matters": "Role owns clusters",
            "where_in_job_posting": "mentions orchestration",
            "transferable_angle": "Docker experience",
            "how_to_surface": "Add bullet on prod deploys"
          }
        ],
        "positioning_recommendations": ["Elevate production wins."],
        "impact_metrics_gaps": [
          { "resume_excerpt": "Led team", "gap": "No scale", "suggested_direction": "Add team size" }
        ],
        "resume_strengths": ["Clear architecture"],
        "prioritized_improvements": [
          { "priority": "high", "title": "Fix hero", "detail": "Lead with role fit", "category": "positioning" }
        ]
      }
    JSON

    out = Ai::RejectionFeedbackParser.call(json)

    assert_equal "Solid backend fit but weak frontend signals.", out["executive_summary"]
    assert_equal 72, out["overall_confidence"]
    assert_equal 70, out["confidence_by_section"]["recruiter_observations"]
    assert_equal ["Kubernetes operations"], out["sections"]["missing_skills"]
    assert_equal "strategist_v2", out["prompt_schema_version"]
    assert_equal 1, out["bullet_rewrites"].size
    assert_equal "Worked on APIs", out["bullet_rewrites"].first["original_bullet"]
    assert_equal "K8s", out["contextual_missing_skills"].first["skill_or_term"]
    assert_equal "high", out["prioritized_improvements"].first["priority"]
  end
end
