# frozen_string_literal: true

if ENV["JWT_SECRET_KEY"].to_s.strip.empty?
  if Rails.env.production?
    raise "JWT_SECRET_KEY must be set in production"
  else
    ENV["JWT_SECRET_KEY"] = "why_not_development_jwt_secret_do_not_use_in_production"
  end
end
