# frozen_string_literal: true

module WhyNot
  module SkillLexicon
    # Curated technical vocabulary for deterministic extraction. Extend over time;
    # future AI layers can augment or replace this list.
    TERMS = %w[
      .net agile airflow aks algorithm ansible apache api argocd asp.net async aurora auth authorization aws axios
      azure babel bash bigquery blockchain bootstrap browserify cache caching cassandra ci cd circleci clojure
      cloudfront cloudflare cqrs crm css d3 dagster datadog deno devops django dns docker dotnet dynamodb ec2 eck
      eks elasticsearch eslint etl express fastapi flask gcp git github gitlab golang graphql grpc go
      hadoop hbase helm heroku html http https iam iceberg integration ios java javascript jdbc jest jira jquery
      json kafka kinesis kotlin kubernetes linux llm ldap logging memcached microservices mongodb
      mysql neo4j nestjs nextjs nginx nodejs nosql oauth okhttp okta openapi opentelemetry pandas php pinia postgres
      postgresql prisma prometheus python pytorch rabbitmq rails react reactjs redis redux rest rspec ruby rust s3
      salesforce scala scrum security selenium serverless sidekiq snowflake soap solidity spring springboot sql sqlite
      stripe swift tableau tailwind tanstack tensorflow terraform typescript vite vue webpack websockets xml yaml
      yarn zapier kafka-connect
    ].freeze

    # Multi-token phrases checked after normalizing whitespace (substring search).
    PHRASES = [
      "ruby on rails",
      "react native",
      "node.js",
      "vue.js",
      "next.js",
      "spring boot",
      "google cloud",
      "amazon web services",
      "active record",
      "machine learning",
      "deep learning",
      "large language model",
      "object oriented",
      "test driven",
      "restful api",
      "micro services"
    ].freeze

    SPECIAL_PATTERNS = {
      "c++" => /\bc\+\+\b/i,
      "c#" => /\bc#\b/i,
      ".net" => /\.net\b/i
    }.freeze

    STOPWORDS = %w[
      the and for with that this from your our are was were been being have has had having you will shall can
      could should would must may might need using use used work team role senior junior lead experience years year
      plus strong excellent great good understanding knowledge ability abilities responsibilities requirements preferred
      including include included about into through during before after while where when what which who whom own
      their them they candidate role description job company benefits pay salary remote hybrid office full time part
      looking seeking join us we all any each every both such only just also not but or than then more most some
      very well high level degree bachelor master phd university college equivalent opportunity equal employer
    ].freeze

    DISPLAY_LABELS = {
      ".net" => ".NET",
      "api" => "API",
      "auth" => "Auth",
      "aws" => "AWS",
      "axios" => "Axios",
      "ci" => "CI",
      "cd" => "CD",
      "css" => "CSS",
      "cqrs" => "CQRS",
      "crm" => "CRM",
      "d3" => "D3",
      "dns" => "DNS",
      "ec2" => "EC2",
      "eck" => "ECK",
      "eks" => "EKS",
      "etl" => "ETL",
      "gcp" => "GCP",
      "grpc" => "gRPC",
      "html" => "HTML",
      "http" => "HTTP",
      "https" => "HTTPS",
      "iam" => "IAM",
      "ios" => "iOS",
      "jdbc" => "JDBC",
      "json" => "JSON",
      "ldap" => "LDAP",
      "llm" => "LLM",
      "nestjs" => "NestJS",
      "nextjs" => "Next.js",
      "nlp" => "NLP",
      "nosql" => "NoSQL",
      "oauth" => "OAuth",
      "okta" => "Okta",
      "php" => "PHP",
      "rpc" => "RPC",
      "rspec" => "RSpec",
      "s3" => "S3",
      "sdk" => "SDK",
      "seo" => "SEO",
      "sql" => "SQL",
      "sso" => "SSO",
      "tsx" => "TSX",
      "ui" => "UI",
      "ux" => "UX",
      "vite" => "Vite",
      "xml" => "XML",
      "yaml" => "YAML",
      "nodejs" => "Node.js",
      "postgresql" => "PostgreSQL",
      "javascript" => "JavaScript",
      "typescript" => "TypeScript",
      "tanstack" => "TanStack",
      "webpack" => "Webpack",
      "redis" => "Redis",
      "mongodb" => "MongoDB",
      "kubernetes" => "Kubernetes",
      "docker" => "Docker",
      "terraform" => "Terraform",
      "ansible" => "Ansible",
      "graphql" => "GraphQL",
      "fastapi" => "FastAPI",
      "django" => "Django",
      "rails" => "Rails",
      "ruby" => "Ruby",
      "react" => "React",
      "vue" => "Vue",
      "pandas" => "Pandas",
      "pytest" => "Pytest",
      "jest" => "Jest",
      "c++" => "C++",
      "c#" => "C#",
      "go" => "Go",
      "golang" => "Go",
      "kotlin" => "Kotlin",
      "swift" => "Swift",
      "scala" => "Scala",
      "rust" => "Rust",
      "springboot" => "Spring Boot",
      "ruby_on_rails" => "Ruby on Rails",
      "react_native" => "React Native",
      "spring_boot" => "Spring Boot",
      "google_cloud" => "Google Cloud",
      "amazon_web_services" => "Amazon Web Services",
      "active_record" => "Active Record",
      "machine_learning" => "Machine Learning",
      "deep_learning" => "Deep Learning",
      "large_language_model" => "Large Language Model",
      "object_oriented" => "Object-Oriented",
      "test_driven" => "Test-Driven",
      "restful_api" => "RESTful API",
      "micro_services" => "Microservices"
    }.freeze

    module_function

    def label_for(slug)
      DISPLAY_LABELS[slug] || slug.to_s.split(/[_\s]+/).map(&:capitalize).join(" ")
    end
  end
end
