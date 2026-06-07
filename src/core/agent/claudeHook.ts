import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const HOOK_COMMAND = "npx scopediff check --hook";

export type InstallHookResult = {
  path: string;
  changed: boolean;
  message: string;
};

type CommandHook = { type: string; command: string };
type HookEntry = { matcher?: string; hooks?: CommandHook[] };
type Settings = {
  hooks?: { Stop?: HookEntry[] } & Record<string, unknown>;
} & Record<string, unknown>;

// Installs a Claude Code Stop hook that runs `scopediff check --hook` after each
// turn. Merges into .claude/settings.json without clobbering existing settings,
// and is idempotent (re-running does not add a duplicate hook).
export function installClaudeStopHook(cwd: string): InstallHookResult {
  const settingsPath = path.join(cwd, ".claude", "settings.json");
  const settings = readSettings(settingsPath);

  const hooks = (settings.hooks ??= {});
  const stopEntries = (hooks.Stop ??= []);

  if (hasScopeDiffHook(stopEntries)) {
    return {
      path: settingsPath,
      changed: false,
      message: `ScopeDiff Stop hook already present in ${settingsPath}`
    };
  }

  stopEntries.push({
    hooks: [{ type: "command", command: HOOK_COMMAND }]
  });

  mkdirSync(path.dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  return {
    path: settingsPath,
    changed: true,
    message: `Installed ScopeDiff Stop hook in ${settingsPath}`
  };
}

function readSettings(settingsPath: string): Settings {
  if (!existsSync(settingsPath)) {
    return {};
  }

  const raw = readFileSync(settingsPath, "utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Settings;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot install Stop hook: ${settingsPath} is not valid JSON (${message}). Fix it and retry.`
    );
  }
}

function hasScopeDiffHook(entries: HookEntry[]): boolean {
  return entries.some((entry) =>
    entry.hooks?.some((hook) => hook.command?.includes("scopediff"))
  );
}
