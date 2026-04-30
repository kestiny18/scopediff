import type { ChangedFile } from "../../types/index.js";

type MutableChangedFile = ChangedFile;

export function parseDiff(diffText: string): ChangedFile[] {
  const files: MutableChangedFile[] = [];
  let current: MutableChangedFile | undefined;

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      if (current) {
        files.push(current);
      }
      current = createFileFromDiffHeader(line);
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith("new file mode")) {
      current.status = "added";
      continue;
    }

    if (line.startsWith("deleted file mode")) {
      current.status = "deleted";
      continue;
    }

    if (line.startsWith("rename from ")) {
      current.previousPath = line.slice("rename from ".length).trim();
      current.status = "renamed";
      continue;
    }

    if (line.startsWith("rename to ")) {
      current.path = line.slice("rename to ".length).trim();
      current.status = "renamed";
      continue;
    }

    if (line.startsWith("+++ b/")) {
      current.path = line.slice("+++ b/".length);
      continue;
    }

    if (line.startsWith("--- a/") && current.status === "deleted") {
      current.path = line.slice("--- a/".length);
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions += 1;
      current.changedLines.push(line.slice(1));
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      current.changedLines.push(line.slice(1));
    }
  }

  if (current) {
    files.push(current);
  }

  return files.filter((file) => file.path && file.path !== "/dev/null");
}

function createFileFromDiffHeader(line: string): MutableChangedFile {
  const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
  const path = match?.[2] ?? "unknown";

  return {
    path,
    status: "modified",
    additions: 0,
    deletions: 0,
    isTest: false,
    isDocs: false,
    isSensitiveFile: false,
    domains: [],
    changedLines: []
  };
}
