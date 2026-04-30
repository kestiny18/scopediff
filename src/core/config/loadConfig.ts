import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ScopeDiffConfig } from "../../types/index.js";
import { defaultConfig } from "./defaultConfig.js";
import { configSchema } from "./schema.js";

export type LoadedConfig = {
  config: ScopeDiffConfig;
  path?: string;
};

export function loadConfig(cwd: string, configPath?: string): LoadedConfig {
  const resolvedPath = resolveConfigPath(cwd, configPath);
  if (!resolvedPath) {
    return { config: cloneConfig(defaultConfig) };
  }

  const raw = readFileSync(resolvedPath, "utf8");
  const parsedYaml = YAML.parse(raw) ?? {};
  const merged = deepMerge(cloneConfig(defaultConfig) as unknown as Record<string, unknown>, parsedYaml);
  const parsedConfig = configSchema.safeParse(merged);

  if (!parsedConfig.success) {
    throw new Error(`Invalid config ${resolvedPath}: ${parsedConfig.error.message}`);
  }

  return {
    config: parsedConfig.data,
    path: resolvedPath
  };
}

function resolveConfigPath(cwd: string, configPath?: string): string | undefined {
  if (configPath) {
    const resolved = path.resolve(cwd, configPath);
    if (!existsSync(resolved)) {
      throw new Error(`Config file not found: ${resolved}`);
    }
    return resolved;
  }

  const localConfig = path.join(cwd, "scopediff.yml");
  return existsSync(localConfig) ? localConfig : undefined;
}

function cloneConfig(config: ScopeDiffConfig): ScopeDiffConfig {
  return JSON.parse(JSON.stringify(config)) as ScopeDiffConfig;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target: Record<string, unknown>, source: unknown): Record<string, unknown> {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source as Record<string, unknown>;
  }

  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (Array.isArray(value)) {
      target[key] = value;
    } else if (isPlainObject(existing) && isPlainObject(value)) {
      target[key] = deepMerge(existing, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}
