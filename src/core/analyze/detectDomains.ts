import { domainKeywords } from "../context/keywordMap.js";

export function detectDomains(filePath: string): string[] {
  const normalized = normalizePath(filePath);
  const lowerPath = normalized.toLowerCase();
  // Tokenize from the original-case path so camelCase boundaries survive
  // (e.g. "LoginController" -> login, controller) before lowercasing.
  const tokens = new Set(tokenizePath(normalized));
  const domains = new Set<string>();

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      if (containsPathTerm(tokens, lowerPath, keyword.toLowerCase())) {
        domains.add(domain);
      }
    }
  }

  if (containsPathTerm(tokens, lowerPath, "test") || containsPathTerm(tokens, lowerPath, "spec")) {
    domains.add("test");
  }

  if (lowerPath.endsWith(".md") || lowerPath.endsWith(".mdx") || lowerPath.startsWith("docs/")) {
    domains.add("docs");
  }

  return [...domains];
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function containsPathTerm(tokens: Set<string>, lowerPath: string, term: string): boolean {
  // CJK keywords have no token boundaries, so fall back to substring matching.
  if (/[\u3400-\u9fff]/.test(term)) {
    return lowerPath.includes(term);
  }

  // Whole-token match only. Substring matching produced false positives such as
  // "authors/" -> auth and "reorder.ts" -> order. camelCase-aware tokens keep
  // recall (e.g. "LoginController" -> login).
  return tokens.has(term);
}

function tokenizePath(filePath: string): string[] {
  return filePath
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}
