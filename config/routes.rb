# frozen_string_literal: true

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "registrations#create"
      post "auth/login", to: "sessions#create"

      get "me", to: "users#show"

      resources :resumes do
        scope module: :resumes do
          resource :studio, only: [ :show ], controller: "studio" do
            get :versions
            post :save_version
            get :rewrites
            post :bullet_rewrite
            post :writing_insights
            post :tailoring
            post :impact_scan
          end
        end
      end
      resources :job_applications do
        resource :analysis_result, only: [ :show, :create ]
        resources :ai_rejection_analyses, only: [ :index, :show, :create ]
      end
    end
  end
end
