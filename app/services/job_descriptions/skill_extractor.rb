# frozen_string_literal: true

module JobDescriptions
  class SkillExtractor
    def self.call(text)
      new(text).extract
    end

    def initialize(raw_text)
      @raw_text = raw_text.to_s
      @normalized = normalize(@raw_text)
    end

    def extract
      slugs = []
      WhyNot::SkillLexicon::SPECIAL_PATTERNS.each do |slug, pattern|
        slugs << slug if @raw_text.match?(pattern)
      end

      WhyNot::SkillLexicon::TERMS.each do |term|
        next if term.length < 2
        next if WhyNot::SkillLexicon::SPECIAL_PATTERNS.key?(term)

        slugs << term if term_found?(term)
      end

      WhyNot::SkillLexicon::PHRASES.each do |phrase|
        slug = phrase_to_slug(phrase)
        slugs << slug if @normalized.include?(normalize(phrase))
      end

      slugs.uniq.sort
    end

    private

    def normalize(str)
      str.to_s.downcase.gsub(/[[:space:]]+/, " ").strip
    end

    def term_found?(term)
      if term.include?(".")
        @normalized.include?(term.downcase)
      else
        @normalized.match?(/\b#{Regexp.escape(term)}\b/i)
      end
    end

    def phrase_to_slug(phrase)
      phrase.downcase.gsub(/[^a-z0-9]+/, "_").gsub(/_+\z/, "").gsub(/\A_+/, "")
    end
  end
end
