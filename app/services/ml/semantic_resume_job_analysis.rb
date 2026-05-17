# frozen_string_literal: true

require "digest"
require "set"

module Ml
  # Embedding-driven signals layered on top of lexical SkillLexicon matching.
  # Uses sentence-transformers via ml/python/embed_batch.py (not OpenAI). AI rejection flows stay separate.
  class SemanticResumeJobAnalysis
    DOC_CHAR_LIMIT = 12_000
    JOB_ANCHOR_CHAR_LIMIT = 2_000
    CHUNK_SIZE = 450
    MAX_CHUNKS = 22
    SKILL_SIM_TRANSFERRABLE = 0.52
    SKILL_SIM_SYNONYM = 0.78
    MAX_RELATED_MAPPINGS = 14
    MAX_SNIPPETS = 3
    RELATED_EXP_MIN_SIM = 0.32

    def self.call(job_description:, resume_text:, resume:, job_application:, lexical:)
      new(job_description:, resume_text:, resume:, job_application:, lexical:).build
    end

    def initialize(job_description:, resume_text:, resume:, job_application:, lexical:)
      @job_description = job_description.to_s
      @resume_text = resume_text.to_s
      @resume = resume
      @job_application = job_application
      @lexical = lexical
    end

    def build
      return disabled_payload("disabled") if Ml::Embeddings::PythonBatchEmbedder.disabled?
      return disabled_payload("unavailable") unless Ml::Embeddings::PythonBatchEmbedder.script_present?

      monotonic_start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      model_id = Ml::Embeddings::PythonBatchEmbedder.model_id

      job_doc = truncate(@job_description, DOC_CHAR_LIMIT)
      resume_doc = truncate(@resume_text, DOC_CHAR_LIMIT)
      resume_fingerprint = "#{model_id}:#{Digest::SHA256.hexdigest(resume_doc)}"
      job_fingerprint = "#{model_id}:#{Digest::SHA256.hexdigest(job_doc)}"

      cached_resume_vec = load_cached_resume_vector(resume_fingerprint)
      cached_job_vec = load_cached_job_vector(job_fingerprint)

      chunks = resume_chunks(@resume_text)
      texts, slot_index, skill_layout = build_embed_text_list(
        job_doc: job_doc,
        resume_doc: resume_doc,
        chunks: chunks,
        cached_job_vec: cached_job_vec,
        cached_resume_vec: cached_resume_vec
      )

      raw_vectors =
        if texts.empty?
          []
        else
          Ml::Embeddings::PythonBatchEmbedder.embed(texts: texts, model: model_id)
        end
      vectors = raw_vectors.map { |row| row.map(&:to_f) }

      job_vec = cached_job_vec || (slot_index[:job] ? vectors[slot_index[:job]] : nil)
      resume_final_vec = cached_resume_vec || (slot_index[:resume] ? vectors[slot_index[:resume]] : nil)

      if job_vec.blank? || resume_final_vec.blank?
        return {
          "status" => "error",
          "model_id" => model_id,
          "message" => "Could not resolve document embeddings (missing cache slot)."
        }
      end

      persist_resume_vector!(resume_final_vec, resume_fingerprint) if cached_resume_vec.nil?
      persist_job_vector!(job_vec, job_fingerprint) if cached_job_vec.nil?

      doc_cosine = Ml::VectorMath.cosine_similarity(job_vec, resume_final_vec)
      semantic_document_score = (doc_cosine * 100).round.clamp(0, 100)

      chunk_range = slot_index[:chunk_range]
      chunk_vectors =
        if chunk_range && !chunk_range.size.zero?
          vectors[chunk_range]
        else
          []
        end

      skill_start = skill_layout[:start]
      skill_block = vectors.drop(skill_start)
      skill_stats = analyze_skills(skill_block, skill_layout)

      best_chunk_sim = max_chunk_similarity(job_vec, chunk_vectors)
      best_chunk_score = (best_chunk_sim * 100).round.clamp(0, 100)

      snippets = build_related_experience(job_vec, chunks, chunk_vectors)
      snippets = snippets.select { |h| h["similarity"].to_f >= RELATED_EXP_MIN_SIM }

      keyword_percent = @lexical.dig("keyword_overlap", "coverage_percent").to_f
      experience_score = @lexical.dig("experience_alignment", "score").to_f

      semantic_skill_alignment_score = (skill_stats[:coverage_ratio] * 100).round.clamp(0, 100)
      keyword_semantic_lift = (semantic_document_score - keyword_percent).round(1)

      transferable = skill_stats[:mappings].select { |m| m["relationship"] == "transferable" }
      synonyms = skill_stats[:mappings].select { |m| m["relationship"] == "synonym_or_close" }

      blended = compute_blended_fit(
        doc_score: semantic_document_score,
        semantic_skill_ratio: skill_stats[:coverage_ratio],
        keyword_percent: keyword_percent,
        experience_score: experience_score,
        chunk_score: best_chunk_score
      )

      latency_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - monotonic_start) * 1000).round

      {
        "status" => "active",
        "model_id" => model_id,
        "document_similarity" => doc_cosine.round(4),
        "semantic_document_score" => semantic_document_score,
        "blended_fit_score" => blended,
        "semantic_skill_coverage_ratio" => skill_stats[:coverage_ratio].round(3),
        "lexical_skill_coverage_ratio" => skill_stats[:lexical_ratio].round(3),
        "semantic_skill_alignment_score" => semantic_skill_alignment_score,
        "best_chunk_similarity" => best_chunk_sim.round(4),
        "best_chunk_score" => best_chunk_score,
        "keyword_semantic_lift" => keyword_semantic_lift,
        "related_skill_mappings" => skill_stats[:mappings].first(MAX_RELATED_MAPPINGS),
        "transferable_skill_mappings" => transferable.first(MAX_RELATED_MAPPINGS),
        "synonym_skill_mappings" => synonyms.first(MAX_RELATED_MAPPINGS),
        "semantic_true_gaps" => skill_stats[:true_gaps],
        "related_experience" => snippets.first(MAX_SNIPPETS),
        "embedding_latency_ms" => latency_ms,
        "cache" => {
          "resume_doc_vector" => cached_resume_vec.present?,
          "job_doc_vector" => cached_job_vec.present?
        }
      }
    rescue Ml::Embeddings::PythonBatchEmbedder::EmbeddingError => e
      {
        "status" => "error",
        "model_id" => Ml::Embeddings::PythonBatchEmbedder.model_id,
        "message" => e.message.truncate(500)
      }
    end

    private

    def disabled_payload(status)
      {
        "status" => status,
        "model_id" => Ml::Embeddings::PythonBatchEmbedder.model_id,
        "message" =>
          if status == "disabled"
            "Semantic embeddings disabled (WHYNOT_DISABLE_SEMANTIC_EMBEDDINGS)."
          else
            "Python worker or sentence-transformers not installed; see README (ml/python)."
          end
      }
    end

    def truncate(str, max)
      s = str.to_s
      return s if s.length <= max

      s[0, max]
    end

    def resume_chunks(text)
      parts = text.split(/\n{2,}/).map(&:strip).reject(&:blank?)
      parts = [ text.to_s.strip ] if parts.empty?
      pieces = parts.flat_map do |p|
        p.length <= CHUNK_SIZE ? [ p ] : p.scan(/.{1,#{CHUNK_SIZE}}/m)
      end
      pieces.first(MAX_CHUNKS)
    end

    def load_cached_resume_vector(fingerprint)
      if @resume&.semantic_doc_fingerprint == fingerprint && @resume.semantic_doc_embedding.is_a?(Array)
        return @resume.semantic_doc_embedding.map(&:to_f)
      end

      nil
    end

    def load_cached_job_vector(fingerprint)
      if @job_application&.semantic_job_doc_fingerprint == fingerprint && @job_application.semantic_job_doc_embedding.is_a?(Array)
        return @job_application.semantic_job_doc_embedding.map(&:to_f)
      end

      nil
    end

    def build_embed_text_list(job_doc:, resume_doc:, chunks:, cached_job_vec:, cached_resume_vec:)
      texts = []
      slot_index = {}

      unless cached_job_vec
        slot_index[:job] = texts.size
        texts << job_doc
      end

      unless cached_resume_vec
        slot_index[:resume] = texts.size
        texts << resume_doc
      end

      chunk_start = texts.size
      texts.concat(chunks)
      slot_index[:chunk_range] = chunk_start...(chunk_start + chunks.size)

      skill_layout = append_skill_texts(texts)
      [ texts, slot_index, skill_layout ]
    end

    def append_skill_texts(texts)
      job_rows = skill_rows_for(:job)
      resume_rows = skill_rows_for(:resume)
      start = texts.size
      job_rows.each { |(_slug, label)| texts << "Skill: #{label}" }
      resume_rows.each { |(_slug, label)| texts << "Skill: #{label}" }
      {
        start: start,
        job_count: job_rows.size,
        resume_count: resume_rows.size,
        job_rows: job_rows,
        resume_rows: resume_rows
      }
    end

    def skill_rows_for(side)
      case side
      when :job
        slugs = (slug_list(:matching) + slug_list(:missing)).uniq
      when :resume
        slugs = (slug_list(:matching) + slug_list(:extra)).uniq
      else
        slugs = []
      end
      slugs.map { |s| [ s, WhyNot::SkillLexicon.label_for(s) ] }
    end

    def slug_list(kind)
      key =
        case kind
        when :matching then "matching_skills"
        when :missing then "missing_skills"
        when :extra then "extra_resume_skills"
        end
      (@lexical[key] || []).filter_map { |h| h["slug"].presence }
    end

    def matching_slug_set
      @matching_slug_set ||= slug_list(:matching).to_set
    end

    def job_slug_set_all
      @job_slug_set_all ||= (slug_list(:matching) + slug_list(:missing)).uniq
    end

    def analyze_skills(skill_block, layout)
      jc = layout[:job_count]
      rc = layout[:resume_count]
      return default_skill_stats if jc.zero? && rc.zero?

      job_mat = skill_block[0, jc] || []
      res_mat = skill_block[jc, rc] || []

      mappings = []
      lexical_covered = matching_slug_set
      semantic_covered = lexical_covered.dup

      layout[:job_rows].each_with_index do |(job_slug, _), i|
        next if lexical_covered.include?(job_slug)

        best_k = nil
        best_sim = -1.0
        res_mat.each_with_index do |rv, k|
          sim = Ml::VectorMath.cosine_similarity(job_mat[i], rv)
          if sim > best_sim
            best_sim = sim
            best_k = k
          end
        end

        next unless best_sim >= SKILL_SIM_TRANSFERRABLE && !best_k.nil?

        res_slug = layout[:resume_rows][best_k][0]
        mappings << {
          "job_skill" => skill_row(job_slug),
          "resume_skill" => skill_row(res_slug),
          "similarity" => best_sim.round(3),
          "relationship" => (best_sim >= SKILL_SIM_SYNONYM) ? "synonym_or_close" : "transferable"
        }
        semantic_covered << job_slug
      end

      job_total = job_slug_set_all.size
      lexical_ratio = job_total.zero? ? 1.0 : lexical_covered.size.to_f / job_total
      coverage_ratio = job_total.zero? ? 1.0 : semantic_covered.size.to_f / job_total

      true_gaps = job_slug_set_all.reject { |s| semantic_covered.include?(s) }.map { |s| skill_row(s) }

      {
        mappings: mappings,
        true_gaps: true_gaps,
        coverage_ratio: coverage_ratio.clamp(0.0, 1.0),
        lexical_ratio: lexical_ratio.clamp(0.0, 1.0)
      }
    end

    def default_skill_stats
      {
        mappings: [],
        true_gaps: [],
        coverage_ratio: 1.0,
        lexical_ratio: 1.0
      }
    end

    def max_chunk_similarity(job_vec, chunk_vectors)
      return 0.0 if chunk_vectors.blank?

      chunk_vectors.filter_map do |vec|
        next if vec.blank?

        Ml::VectorMath.cosine_similarity(job_vec, vec)
      end.max || 0.0
    end

    def build_related_experience(job_vec, chunks, chunk_vectors)
      return [] if chunks.empty? || chunk_vectors.blank? || chunks.size != chunk_vectors.size

      scored = chunks.each_with_index.filter_map do |chunk, i|
        vec = chunk_vectors[i]
        next if vec.blank?

        sim = Ml::VectorMath.cosine_similarity(job_vec, vec)
        {
          "resume_excerpt" => excerpt(chunk),
          "job_anchor_excerpt" => excerpt(@job_description, JOB_ANCHOR_CHAR_LIMIT),
          "similarity" => sim.round(3)
        }
      end

      scored.sort_by { |h| -h["similarity"].to_f }
    end

    def excerpt(str, max = 220)
      s = str.to_s.gsub(/\s+/, " ").strip
      return s if s.length <= max

      s[0, max]
    end

    def compute_blended_fit(doc_score:, semantic_skill_ratio:, keyword_percent:, experience_score:, chunk_score:)
      kw = keyword_percent.clamp(0, 100)
      exp = experience_score.clamp(0, 100)
      sem = (semantic_skill_ratio * 100).clamp(0, 100)
      chk = chunk_score.clamp(0, 100)
      (0.30 * doc_score + 0.24 * sem + 0.18 * chk + 0.16 * kw + 0.12 * exp).round.clamp(0, 100)
    end

    def skill_row(slug)
      { "slug" => slug, "label" => WhyNot::SkillLexicon.label_for(slug) }
    end

    def persist_resume_vector!(resume_vec, fingerprint)
      return unless @resume && resume_vec.present?

      @resume.update_columns(
        semantic_doc_embedding: resume_vec,
        semantic_doc_fingerprint: fingerprint,
        updated_at: Time.current
      )
    end

    def persist_job_vector!(job_vec, fingerprint)
      return unless @job_application && job_vec.present?

      @job_application.update_columns(
        semantic_job_doc_embedding: job_vec,
        semantic_job_doc_fingerprint: fingerprint,
        updated_at: Time.current
      )
    end
  end
end
