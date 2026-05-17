# frozen_string_literal: true

module Ml
  module VectorMath
    module_function

    def cosine_similarity(a, b)
      return 0.0 if a.nil? || b.nil? || a.empty? || b.empty? || a.length != b.length

      dot = 0.0
      a.each_with_index { |x, i| dot += x * b[i] }
      dot.clamp(-1.0, 1.0)
    end
  end
end
