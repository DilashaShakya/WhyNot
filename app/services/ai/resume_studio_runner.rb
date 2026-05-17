# frozen_string_literal: true

module Ai
  class ResumeStudioRunner
    MODEL = ENV.fetch("OPENAI_MODEL", "gpt-4o-mini").freeze

    class Error < StandardError; end

    def self.bullet_rewrite(resume:, bullet_text:, section_heading: nil, job_application: nil)
      raise Error, "Bullet text is blank" if bullet_text.blank?

      job_ctx = ResumeStudioPrompt.job_context(job_application)
      messages = [
        { role: "system", content: ResumeStudioPrompt::SYSTEM },
        {
          role: "user",
          content: ResumeStudioPrompt.bullet_rewrite_user(
            resume_title: resume.title,
            bullet_text: bullet_text,
            section_heading: section_heading,
            job_context: job_ctx
          )
        }
      ]
      complete_json!(messages)
    end

    def self.writing_insights(resume:, resume_body:, job_application: nil)
      raise Error, "Resume body is blank" if resume_body.blank?

      job_ctx = ResumeStudioPrompt.job_context(job_application)
      messages = [
        { role: "system", content: ResumeStudioPrompt::SYSTEM },
        {
          role: "user",
          content: ResumeStudioPrompt.resume_writing_insights_user(
            resume_title: resume.title,
            resume_body: resume_body,
            job_context: job_ctx
          )
        }
      ]
      out = complete_json!(messages)
      normalize_writing_insights_response!(out)
      out
    end

    def self.tailoring(resume:, resume_body:, job_application:)
      raise Error, "Job context required for tailoring" if job_application.blank?
      raise Error, "Resume body is blank" if resume_body.blank?

      messages = [
        { role: "system", content: ResumeStudioPrompt::SYSTEM },
        {
          role: "user",
          content: ResumeStudioPrompt.tailoring_user(
            resume_title: resume.title,
            resume_body: resume_body,
            job_application: job_application
          )
        }
      ]
      complete_json!(messages)
    end

    def self.impact_scan(resume:, resume_body:, job_application: nil)
      raise Error, "Resume body is blank" if resume_body.blank?

      job_ctx = ResumeStudioPrompt.job_context(job_application)
      messages = [
        { role: "system", content: ResumeStudioPrompt::SYSTEM },
        {
          role: "user",
          content: ResumeStudioPrompt.impact_scan_user(
            resume_title: resume.title,
            resume_body: resume_body,
            job_context: job_ctx
          )
        }
      ]
      complete_json!(messages)
    end

    def self.complete_json!(messages)
      raw = ::OpenaiHttpClient.chat_json(messages: messages, model: MODEL)
      payload = raw["content"].to_s.strip
      obj =
        begin
          JSON.parse(payload)
        rescue JSON::ParserError
          inner = payload[/\{[\s\S]*\}\s*\z/m] || payload
          JSON.parse(inner)
        end
      raise Error, "AI returned a non-object JSON payload" unless obj.is_a?(Hash)

      obj = obj.deep_stringify_keys
      obj["openai_response_id"] = raw["id"]
      obj["openai_model"] = raw["model"]
      obj
    rescue JSON::ParserError => e
      raise Error, "Could not parse AI response: #{e.message.truncate(200)}"
    end
    private_class_method :complete_json!

    # Models sometimes wrap keys or use camelCase; unwrap so the API contract is stable for the client.
    def self.normalize_writing_insights_response!(h)
      inner = h.delete("resume_writing_insights")
      if inner.is_a?(Array)
        h["match_items"] = inner if h["match_items"].blank? && h["requirements"].blank?
      elsif inner.is_a?(Hash)
        # Merge wrapper payload into the root object in-place (was leaking a re-assigned local before).
        h.replace(inner.deep_stringify_keys.merge(h))
      end

      h["overview"] ||= h.delete("document_overview")

      wi = h["writing_insights"] || h.delete("writingInsights")
      normalized_wi = normalize_insight_rows!(wi)

      items_raw = h["match_items"] || h.delete("matchItems") || h["requirements"] || h.delete("top_requirements")
      h["match_items"] = normalize_match_items!(items_raw)
      h["match_items"] = match_items_from_legacy_insights!(normalized_wi) if h["match_items"].blank? && normalized_wi.present?

      reconcile_summary_counts!(h)

      h["writing_insights"] = normalized_wi

      sn = h["section_notes"] || h.delete("sectionNotes")
      h["section_notes"] = normalize_section_notes!(sn)

      cc = h["cross_cutting"] || h.delete("crossCutting")
      h["cross_cutting"] = normalize_string_array(cc)

      ats = h["ats_readability_notes"] || h.delete("atsReadabilityNotes")
      h["ats_readability_notes"] = normalize_string_array(ats)

      h
    end
    private_class_method :normalize_writing_insights_response!

    def self.reconcile_summary_counts!(h)
      items = h["match_items"] || []
      h["summary"] = {
        "critical_gaps" => items.count { |i| i["status"] == "critical_gap" },
        "moderate_gaps" => items.count { |i| i["status"] == "moderate_gap" },
        "strong_matches" => items.count { |i| i["status"] == "strong_match" }
      }
    end
    private_class_method :reconcile_summary_counts!

    def self.match_items_from_legacy_insights!(insights)
      return [] if insights.blank?

      insights.each_with_index.map do |row, idx|
        {
          "rank" => idx + 1,
          "importance_rank" => idx + 1,
          "title" => row["title"].to_s,
          "description" => row["detail"].to_s,
          "status" => "moderate_gap",
          "points_earned" => 5,
          "points_possible" => 10,
          "resume_evidence" => nil,
          "coaching" => row["detail"].to_s,
          "rewrite_section" => {
            "headline" => "Ways to strengthen this on your resume",
            "bullets" => [ row["detail"].to_s ].reject(&:blank?).uniq,
            "example_snippets" => []
          }
        }
      end
    end
    private_class_method :match_items_from_legacy_insights!

    def self.normalize_match_items!(raw)
      rows =
        case raw
        when Array then raw
        when Hash then raw.values
        else []
        end

      out = rows.filter_map do |row|
        row = row.deep_stringify_keys if row.is_a?(Hash)
        next unless row.is_a?(Hash)

        title = row["title"].presence || row["heading"].presence || row["name"].presence || "Requirement"
        description =
          row["description"].presence || row["detail"].presence || row["body"].presence ||
            row["requirement_text"].presence || ""
        status = normalize_insight_status(row["status"])

        pe = row["points_earned"].to_s.strip.present? ? row["points_earned"].to_i : 0
        pp = row["points_possible"].to_s.strip.present? ? row["points_possible"].to_i : 0
        imp = row["importance_rank"].presence || row["importance"]
        imp = imp.present? ? imp.to_i : 0
        rk = row["rank"].present? ? row["rank"].to_i : 0

        pp = 10 if pp <= 0
        pe = 0 if pe.negative?
        pe = [ pe, pp ].min

        coaching = row["coaching"].presence&.to_s
        rewrite = normalize_rewrite_section!(row["rewrite_section"] || row["rewrite"])
        if rewrite.nil? && coaching.present?
          rewrite = {
            "headline" => "Rewrite & next steps",
            "bullets" => [ coaching ],
            "example_snippets" => []
          }
        end

        {
          "rank" => rk,
          "importance_rank" => imp,
          "title" => title.to_s,
          "description" => description.to_s,
          "status" => status,
          "points_earned" => pe,
          "points_possible" => pp,
          "resume_evidence" => row["resume_evidence"].presence&.to_s,
          "coaching" => coaching,
          "rewrite_section" => rewrite
        }
      end

      out.each { |i| i["importance_rank"] = 1_000 if i["importance_rank"].to_i <= 0 }
      out.sort_by! { |i| [ i["importance_rank"], i["title"].to_s ] }
      out.each_with_index do |i, idx|
        i["rank"] = idx + 1
      end

      out
    end
    private_class_method :normalize_match_items!

    def self.normalize_insight_status(s)
      s = s.to_s.downcase.tr(" ", "_").tr("-", "_")
      return "critical_gap" if s.include?("critical")
      return "moderate_gap" if s.include?("moderate") || s.include?("partial") || s.include?("gap")
      return "strong_match" if s.include?("strong") || s.include?("match") || s.include?("aligned")

      "moderate_gap"
    end
    private_class_method :normalize_insight_status

    def self.normalize_rewrite_section!(raw)
      return nil if raw.blank?
      return nil unless raw.is_a?(Hash)

      r = raw.deep_stringify_keys
      bullets = normalize_string_array(r["bullets"] || r["rewrite_bullets"] || r["actions"])
      examples_raw = r["example_snippets"] || r["snippets"] || r["examples"]
      snippets =
        case examples_raw
        when Array
          examples_raw.filter_map do |ex|
            ex = ex.deep_stringify_keys if ex.is_a?(Hash)
            next unless ex.is_a?(Hash)

            lab = ex["label"].presence || ex["title"].presence || "Option"
            txt = ex["text"].presence || ex["snippet"].presence
            next if txt.blank?

            { "label" => lab.to_s, "text" => txt.to_s }
          end
        else
          []
        end

      return nil if bullets.empty? && snippets.empty? && r["headline"].blank?

      {
        "headline" => (r["headline"].presence || "Ways to strengthen this on your resume").to_s,
        "bullets" => bullets,
        "example_snippets" => snippets
      }
    end
    private_class_method :normalize_rewrite_section!

    def self.normalize_insight_rows!(raw)
      rows =
        case raw
        when Array then raw
        when Hash then raw.values
        else []
        end
      rows.filter_map do |row|
        row = row.deep_stringify_keys if row.is_a?(Hash)
        next unless row.is_a?(Hash)

        title = row["title"].presence || row["heading"].presence || row["name"].presence
        detail = row["detail"].presence || row["body"].presence || row["description"].presence
        next if title.blank? && detail.blank?

        { "title" => title.to_s, "detail" => detail.to_s }
      end
    end
    private_class_method :normalize_insight_rows!

    def self.normalize_section_notes!(raw)
      rows =
        case raw
        when Array then raw
        when Hash then raw.values
        else []
        end
      rows.filter_map do |row|
        row = row.deep_stringify_keys if row.is_a?(Hash)
        next unless row.is_a?(Hash)

        heading =
          row["section_heading"].presence || row["heading"].presence || row["section"].presence || row["name"].presence
        insights = row["insights"] || row["notes"] || row["bullets"]
        list = normalize_string_array(insights)
        next if heading.blank? && list.empty?

        { "section_heading" => heading.to_s, "insights" => list }
      end
    end
    private_class_method :normalize_section_notes!

    def self.normalize_string_array(raw)
      case raw
      when Array then raw.map(&:to_s).map(&:strip).reject(&:blank?)
      when String then raw.strip.present? ? [ raw.strip ] : []
      else []
      end
    end
    private_class_method :normalize_string_array
  end
end
