import { z } from "zod";

const severitySchema = z.enum(["high", "medium", "info"]);

export const configSchema = z.object({
  version: z.literal(1),
  risk: z.object({
    fail_on: z.array(severitySchema).min(1)
  }),
  diff: z.object({
    max_changed_files: z.number().int().positive(),
    max_diff_lines: z.number().int().positive(),
    max_deleted_lines: z.number().int().positive()
  }),
  context: z.object({
    min_prompt_words: z.number().int().nonnegative(),
    enable_branch_name: z.boolean(),
    enable_commit_message: z.boolean()
  }),
  sensitive_files: z.array(z.string()),
  sensitive_paths: z.array(z.string()),
  ignore: z.array(z.string()),
  tests: z.object({
    patterns: z.array(z.string()),
    allow_test_changes: z.boolean()
  })
});
