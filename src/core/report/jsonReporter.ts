import type { AnalysisResult } from "../../types/index.js";

export function jsonReporter(result: AnalysisResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}
