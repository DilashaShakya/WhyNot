# frozen_string_literal: true

module JobDescriptions
  class KeywordExtractor
    MIN_LENGTH = 4
    MAX_TERMS = 80

    def self.call(text)
      new(text).extract
    end

    def initialize(raw_text)
      @raw_text = raw_text.to_s
    end

    # Returns unique lowercase keywords (alphabetic tokens) for overlap metrics.
    def extract
      tokens = @raw_text.downcase.scan(/[a-z][a-z0-9+]{#{MIN_LENGTH - 1},}/i)
      stop = WhyNot::SkillLexicon::STOPWORDS
      filtered = tokens.reject { |t| stop.include?(t) }.uniq
      filtered.first(MAX_TERMS).sort
    end
  end
end
