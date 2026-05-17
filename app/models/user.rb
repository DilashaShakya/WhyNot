# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  before_validation :normalize_email

  has_many :resumes, dependent: :destroy
  has_many :job_applications, dependent: :destroy

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP, message: "is not a valid email" }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || password.present? }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end
