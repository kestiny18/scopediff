import picomatch from "picomatch";
import type { ChangedFile, ScopeDiffConfig } from "../../types/index.js";
import { detectDomains, normalizePath } from "./detectDomains.js";

const docsPatterns = ["README*", "README.*", "docs/**", "**/*.md", "**/*.mdx"];
const dependencyBuildFiles = [
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Dockerfile",
  "docker-compose.yml"
];
const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"];
const ciPatterns = [".github/workflows/**", ".gitlab-ci.yml"];
const migrationPatterns = ["**/migration/**", "**/migrations/**", "**/schema.sql", "**/*.sql"];

export function classifyFile(file: ChangedFile, config: ScopeDiffConfig): ChangedFile {
  const normalizedPath = normalizePath(file.path);
  const isTest = matchesAny(normalizedPath, config.tests.patterns);
  const isDocs = matchesAny(normalizedPath, docsPatterns);
  const sensitiveCategory = getSensitiveCategory(normalizedPath, config);

  return {
    ...file,
    path: normalizedPath,
    previousPath: file.previousPath ? normalizePath(file.previousPath) : undefined,
    isTest,
    isDocs,
    isSensitiveFile: sensitiveCategory !== undefined,
    sensitiveCategory,
    domains: detectDomains(normalizedPath)
  };
}

export function isIgnoredPath(filePath: string, config: ScopeDiffConfig): boolean {
  return matchesAny(normalizePath(filePath), config.ignore);
}

export function isDependencyBuildFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return matchesAny(normalizedPath, dependencyBuildFiles);
}

export function isLockfile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return matchesAny(normalizedPath, lockfiles);
}

export function isCiFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return matchesAny(normalizedPath, ciPatterns);
}

export function isMigrationFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return matchesAny(normalizedPath, migrationPatterns);
}

export function isEnvSecretFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath).toLowerCase();
  const baseName = normalizedPath.split("/").at(-1) ?? normalizedPath;
  return (
    baseName.startsWith(".env") ||
    normalizedPath.includes("secret") ||
    normalizedPath.includes("credential")
  );
}

export function isSensitivePath(filePath: string, config: ScopeDiffConfig): boolean {
  return matchesAny(normalizePath(filePath), config.sensitive_paths);
}

export function matchesAny(filePath: string, patterns: string[]): boolean {
  return picomatch.isMatch(filePath, patterns, { dot: true });
}

function getSensitiveCategory(filePath: string, config: ScopeDiffConfig): string | undefined {
  if (isEnvSecretFile(filePath)) {
    return "env";
  }
  if (isLockfile(filePath)) {
    return "lockfile";
  }
  if (isDependencyBuildFile(filePath)) {
    return "dependency";
  }
  if (isMigrationFile(filePath)) {
    return "database";
  }
  if (isCiFile(filePath)) {
    return "ci";
  }
  if (isSensitivePath(filePath, config)) {
    return "sensitive_path";
  }
  if (matchesAny(filePath, config.sensitive_files)) {
    return "sensitive_file";
  }
  return undefined;
}
