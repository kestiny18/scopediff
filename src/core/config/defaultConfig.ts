import type { ScopeDiffConfig } from "../../types/index.js";

export const defaultConfig: ScopeDiffConfig = {
  version: 1,
  risk: {
    fail_on: ["high"]
  },
  diff: {
    max_changed_files: 8,
    max_diff_lines: 500,
    max_deleted_lines: 200
  },
  context: {
    min_prompt_words: 4,
    enable_branch_name: true,
    enable_commit_message: true
  },
  sensitive_files: [
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "Dockerfile",
    "docker-compose.yml",
    ".github/workflows/**",
    ".gitlab-ci.yml",
    "**/migration/**",
    "**/migrations/**",
    "**/schema.sql",
    "**/.env*"
  ],
  sensitive_paths: [
    "**/auth/**",
    "**/payment/**",
    "**/billing/**",
    "**/security/**",
    "**/permission/**"
  ],
  ignore: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
  tests: {
    patterns: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/test/**",
      "**/tests/**"
    ],
    allow_test_changes: true
  }
};

export const defaultConfigYaml = `version: 1

risk:
  fail_on:
    - high

diff:
  max_changed_files: 8
  max_diff_lines: 500
  max_deleted_lines: 200

context:
  min_prompt_words: 4
  enable_branch_name: true
  enable_commit_message: true

sensitive_files:
  - "package.json"
  - "package-lock.json"
  - "pnpm-lock.yaml"
  - "yarn.lock"
  - "pom.xml"
  - "build.gradle"
  - "build.gradle.kts"
  - "Dockerfile"
  - "docker-compose.yml"
  - ".github/workflows/**"
  - ".gitlab-ci.yml"
  - "**/migration/**"
  - "**/migrations/**"
  - "**/schema.sql"
  - "**/.env*"

sensitive_paths:
  - "**/auth/**"
  - "**/payment/**"
  - "**/billing/**"
  - "**/security/**"
  - "**/permission/**"

ignore:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - "coverage/**"

tests:
  patterns:
    - "**/*.test.*"
    - "**/*.spec.*"
    - "**/__tests__/**"
    - "**/test/**"
    - "**/tests/**"
  allow_test_changes: true
`;
