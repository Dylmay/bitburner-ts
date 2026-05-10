import { typedMain } from 'lib/callables/typedCallable';
import { CONTRACT_ATTEMPT_CALLABLE } from 'bin/commands/contract/models';

export const main = typedMain(CONTRACT_ATTEMPT_CALLABLE, async ({ ns }, args) => {
  if (!args) {
    ns.alert('No contract specified.');
    return;
  }

  const { hostname, filepath, answer } = args;

  let parsedAnswer: unknown;

  try {
    parsedAnswer = JSON.parse(answer);
  } catch {
    parsedAnswer = answer;
  }

  const result = ns.codingcontract.attempt(parsedAnswer, filepath, hostname);

  ns.alert(result ? `Success: ${result}` : 'Incorrect answer — no reward.');
});
