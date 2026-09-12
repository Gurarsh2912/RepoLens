import { RuleContext } from "./types";

import { tooManyDependenciesRule } from "./tooManyDependencies";
import { largeFileRule } from "./largeFile";
import { consoleStatementRule } from "./consoleStatement";
import { anyTypeRule } from "./anyType";
import { emptyCatchRule } from "./emptyCatch";
import { highComplexityRule } from "./highComplexity";
import { tooManyFunctionsRule } from "./tooManyFunctions";
import { deepNestingRule } from "./deepNesting";

const rules = [
  tooManyDependenciesRule,
  largeFileRule,
  consoleStatementRule,
  anyTypeRule,
  emptyCatchRule,
  highComplexityRule,
  tooManyFunctionsRule,
  deepNestingRule,
];

export function runRules(context: RuleContext) {
  const issues = [];

  for (const rule of rules) {
    const result = rule.run(context);

    issues.push(...result);
  }

  return issues;
}