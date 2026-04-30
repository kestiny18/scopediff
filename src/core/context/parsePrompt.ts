import type { ContextConfidence } from "../../types/index.js";
import { domainKeywords } from "./keywordMap.js";

export type ParsedPrompt = {
  summary: string;
  keywords: string[];
  domains: string[];
  confidence: ContextConfidence;
};

export function parsePrompt(raw: string, minPromptWords = 4): ParsedPrompt {
  const normalized = raw.trim();
  const summary = normalized.replace(/\s+/g, " ").slice(0, 160);

  if (!summary) {
    return {
      summary: "",
      keywords: [],
      domains: [],
      confidence: "none"
    };
  }

  const matchedKeywords = new Set<string>();
  const matchedDomains = new Set<string>();

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      if (containsTerm(normalized, keyword)) {
        matchedKeywords.add(keyword);
        matchedDomains.add(domain);
      }
    }
  }

  const wordScore = approximateWordCount(normalized);
  let confidence: ContextConfidence;

  if (wordScore >= 8 && matchedDomains.size > 0) {
    confidence = "high";
  } else if (wordScore >= minPromptWords) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    summary,
    keywords: [...matchedKeywords],
    domains: [...matchedDomains],
    confidence
  };
}

export function containsTerm(raw: string, term: string): boolean {
  if (containsCjk(term)) {
    return raw.includes(term);
  }

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(raw);
}

function approximateWordCount(raw: string): number {
  const englishTokens = raw.match(/[a-zA-Z0-9_]+/g) ?? [];
  const cjkChars = raw.match(/[\u3400-\u9fff]/g) ?? [];
  return englishTokens.length + Math.floor(cjkChars.length / 2);
}

function containsCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}
