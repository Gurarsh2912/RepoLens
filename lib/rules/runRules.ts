import { RuleContext } from "./types";

import { tooManyDependenciesRule } from "./tooManyDependencies";
import { largeFileRule } from "./largeFile";
import { consoleStatementRule } from "./consoleStatement";
import { anyTypeRule } from "./anyType";
import { emptyCatchRule } from "./emptyCatch";

const rules = [
  tooManyDependenciesRule,
  largeFileRule,
  consoleStatementRule,
  anyTypeRule,
  emptyCatchRule,
];

export function runRules(context: RuleContext) {
  const issues = [];

  for (const rule of rules) {
    const result = rule.run(context);

    issues.push(...result);
  }

  return issues;
}