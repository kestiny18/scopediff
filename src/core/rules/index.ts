import type { Finding } from "../../types/index.js";
import { sd001DependencyFileChanged } from "./sd001DependencyFileChanged.js";
import { sd002LockfileChanged } from "./sd002LockfileChanged.js";
import { sd003MigrationChanged } from "./sd003MigrationChanged.js";
import { sd004CiChanged } from "./sd004CiChanged.js";
import { sd005EnvSecretChanged } from "./sd005EnvSecretChanged.js";
import { sd006TestDeletion } from "./sd006TestDeletion.js";
import { sd007LargeDeletion } from "./sd007LargeDeletion.js";
import { sd008OutOfScopeModule } from "./sd008OutOfScopeModule.js";
import { sd009CrossDomainChanges } from "./sd009CrossDomainChanges.js";
import { sd010LargeDiff } from "./sd010LargeDiff.js";
import { sd011TooManyFilesChanged } from "./sd011TooManyFilesChanged.js";
import { sd012FormattingNoise } from "./sd012FormattingNoise.js";
import { sd013PossibleRenameRefactor } from "./sd013PossibleRenameRefactor.js";
import { sd014SensitivePathChanged } from "./sd014SensitivePathChanged.js";
import { sd015LowContextConfidence } from "./sd015LowContextConfidence.js";
import { sd016RiskOnlyMode } from "./sd016RiskOnlyMode.js";
import { sd017TestUpdated } from "./sd017TestUpdated.js";
import { sd018DocsOnlyChange } from "./sd018DocsOnlyChange.js";
import { sd019OutOfDeclaredScope } from "./sd019OutOfDeclaredScope.js";
import type { Rule, RuleInput } from "./ruleTypes.js";

const rules: Rule[] = [
  sd001DependencyFileChanged,
  sd002LockfileChanged,
  sd003MigrationChanged,
  sd004CiChanged,
  sd005EnvSecretChanged,
  sd006TestDeletion,
  sd007LargeDeletion,
  sd008OutOfScopeModule,
  sd009CrossDomainChanges,
  sd010LargeDiff,
  sd011TooManyFilesChanged,
  sd012FormattingNoise,
  sd013PossibleRenameRefactor,
  sd014SensitivePathChanged,
  sd015LowContextConfidence,
  sd016RiskOnlyMode,
  sd017TestUpdated,
  sd018DocsOnlyChange,
  sd019OutOfDeclaredScope
];

export function runRules(input: RuleInput): Finding[] {
  return rules.flatMap((rule) => rule(input));
}
