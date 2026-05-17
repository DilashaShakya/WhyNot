# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_05_17_120004) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "ai_rejection_analyses", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.integer "status", default: 0, null: false
    t.jsonb "structured_feedback", default: {}, null: false
    t.jsonb "confidence_by_section", default: {}, null: false
    t.integer "overall_confidence"
    t.string "model_id"
    t.string "prompt_version", default: "rejection_v1", null: false
    t.text "error_message"
    t.string "openai_response_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id", "created_at"], name: "index_ai_rejection_on_job_app_id_and_created_at"
    t.index ["job_application_id"], name: "index_ai_rejection_analyses_on_job_application_id"
  end

  create_table "analysis_results", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.integer "status", default: 0, null: false
    t.text "summary"
    t.jsonb "structured_feedback", default: {}, null: false
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id"], name: "index_analysis_results_on_job_application_id", unique: true
    t.index ["structured_feedback"], name: "index_analysis_results_on_structured_feedback", using: :gin
  end

  create_table "job_applications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "resume_id", null: false
    t.string "job_title"
    t.string "company_name"
    t.text "job_description", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "semantic_job_doc_embedding"
    t.string "semantic_job_doc_fingerprint"
    t.index ["resume_id"], name: "index_job_applications_on_resume_id"
    t.index ["user_id", "created_at"], name: "index_job_applications_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_job_applications_on_user_id"
  end

  create_table "resume_studio_rewrites", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "resume_id", null: false
    t.bigint "job_application_id"
    t.string "prompt_kind", null: false
    t.jsonb "input", default: {}, null: false
    t.jsonb "output", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id"], name: "index_resume_studio_rewrites_on_job_application_id"
    t.index ["prompt_kind"], name: "index_resume_studio_rewrites_on_prompt_kind"
    t.index ["resume_id", "created_at"], name: "index_resume_studio_rewrites_on_resume_and_created", order: { created_at: :desc }
    t.index ["resume_id"], name: "index_resume_studio_rewrites_on_resume_id"
    t.index ["user_id"], name: "index_resume_studio_rewrites_on_user_id"
  end

  create_table "resume_studio_versions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "resume_id", null: false
    t.bigint "job_application_id"
    t.text "body_text", null: false
    t.string "label", default: "Snapshot", null: false
    t.string "source", default: "manual", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id"], name: "index_resume_studio_versions_on_job_application_id"
    t.index ["resume_id", "created_at"], name: "index_resume_studio_versions_on_resume_and_created", order: { created_at: :desc }
    t.index ["resume_id"], name: "index_resume_studio_versions_on_resume_id"
    t.index ["user_id"], name: "index_resume_studio_versions_on_user_id"
  end

  create_table "resumes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "parsed_text"
    t.string "parse_error", limit: 2000
    t.datetime "parsed_at"
    t.jsonb "semantic_doc_embedding"
    t.string "semantic_doc_fingerprint"
    t.index ["user_id"], name: "index_resumes_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "display_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "ai_rejection_analyses", "job_applications"
  add_foreign_key "analysis_results", "job_applications"
  add_foreign_key "job_applications", "resumes"
  add_foreign_key "job_applications", "users"
  add_foreign_key "resume_studio_rewrites", "job_applications", on_delete: :nullify
  add_foreign_key "resume_studio_rewrites", "resumes"
  add_foreign_key "resume_studio_rewrites", "users"
  add_foreign_key "resume_studio_versions", "job_applications", on_delete: :nullify
  add_foreign_key "resume_studio_versions", "resumes"
  add_foreign_key "resume_studio_versions", "users"
  add_foreign_key "resumes", "users"
end
