# frozen_string_literal: true

class Resume < ApplicationRecord
  belongs_to :user

  has_many :job_applications, dependent: :restrict_with_error
  has_many :resume_studio_versions, dependent: :destroy
  has_many :resume_studio_rewrites, dependent: :destroy

  has_one_attached :file

  MAX_FILE_BYTES = 5.megabytes
  ALLOWED_CONTENT_TYPES = [ "application/pdf" ].freeze

  validates :title, presence: true, length: { maximum: 255 }
  validates :notes, length: { maximum: 10_000 }, allow_nil: true
  validate :acceptable_file, if: -> { file.attached? }

  private

  def acceptable_file
    type = file.content_type.to_s
    unless ALLOWED_CONTENT_TYPES.include?(type)
      errors.add(:file, "must be a PDF")
      return
    end

    if file.byte_size > MAX_FILE_BYTES
      errors.add(:file, "must be #{MAX_FILE_BYTES / 1.megabyte} MB or smaller")
    end
  end
end
