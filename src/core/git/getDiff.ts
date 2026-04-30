import { execFileSync } from "node:child_process";

export type GetDiffOptions = {
  cwd: string;
  staged?: boolean;
  base?: string;
};

export function getDiff(options: GetDiffOptions): string {
  const args = buildDiffArgs(options);

  try {
    return execFileSync("git", args, {
      cwd: options.cwd,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read git diff: ${message}`);
  }
}

function buildDiffArgs(options: GetDiffOptions): string[] {
  if (options.staged) {
    return ["diff", "--staged"];
  }

  if (options.base) {
    return ["diff", `${options.base}...HEAD`];
  }

  return ["diff", "HEAD"];
}
