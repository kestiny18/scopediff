import { domainKeywords } from "../context/keywordMap.js";

export function detectDomains(filePath: string): string[] {
  const normalized = normalizePath(filePath).toLowerCase();
  const domains = new Set<string>();

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (containsPathTerm(normalized, lowerKeyword)) {
        domains.add(domain);
      }
    }
  }

  if (containsPathTerm(normalized, "test") || containsPathTerm(normalized, "spec")) {
    domains.add("test");
  }

  if (normalized.endsWith(".md") || normalized.endsWith(".mdx") || normalized.startsWith("docs/")) {
    domains.add("docs");
  }

  return [...domains];
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function containsPathTerm(filePath: string, term: string): boolean {
  if (/[\u3400-\u9fff]/.test(term)) {
    return filePath.includes(term);
  }

  const tokens = filePath.split(/[^a-z0-9]+/).filter(Boolean);
  if (term.length <= 2) {
    return tokens.includes(term);
  }

  return filePath.includes(term);
}
