import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { initAgent, type AgentTarget } from "../../core/agent/initAgent.js";
import { defaultConfigYaml } from "../../core/config/defaultConfig.js";

export type InitCommandOptions = {
  target?: string;
};

export function runInit(cwd: string, options: InitCommandOptions): number {
  if (!options.target) {
    return initConfig(cwd);
  }

  if (!isAgentTarget(options.target)) {
    throw new Error(`Unsupported init target: ${options.target}`);
  }

  const result = initAgent(cwd, options.target);
  process.stdout.write(`${result.message}\n`);
  return 0;
}

function initConfig(cwd: string): number {
  const configPath = path.join(cwd, "scopediff.yml");
  if (existsSync(configPath)) {
    process.stdout.write(`scopediff.yml already exists at ${configPath}\n`);
    return 0;
  }

  writeFileSync(configPath, defaultConfigYaml, "utf8");
  process.stdout.write(`Created ${configPath}\n`);
  return 0;
}

function isAgentTarget(value: string): value is AgentTarget {
  return value === "cursor" || value === "codex" || value === "claude";
}
