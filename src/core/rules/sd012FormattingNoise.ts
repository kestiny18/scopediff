import { finding, type Rule } from "./ruleTypes.js";

export const sd012FormattingNoise: Rule = (input) =>
  input.files
    .filter((file) => {
      const changedLineCount = file.changedLines.length;
      if (changedLineCount < 30) {
        return false;
      }

      const formattingLines = file.changedLines.filter(isFormattingLine).length;
      return formattingLines / changedLineCount >= 0.7;
    })
    .map((file) =>
      finding(
        "SD012",
        "medium",
        "Potential formatting noise",
        "Most changed lines look like whitespace, import/export, or punctuation-only changes. Please review whether formatting noise expanded the diff.",
        file.path
      )
    );

function isFormattingLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    /^import\s/.test(trimmed) ||
    /^export\s/.test(trimmed) ||
    /^[{}()[\];,.\s]+$/.test(trimmed)
  );
}
