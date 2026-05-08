const ENFORCED_FUNCTIONS = new Set(['execCallableAndWait', 'runCallableAndWait']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Return value of callable wait functions must be assigned or used.' },
    messages: { ignored: 'Return value of {{name}} must be assigned or used.' },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || !ENFORCED_FUNCTIONS.has(node.callee.name)) {
          return;
        }

        // If awaited, the AwaitExpression is the value being discarded
        const effective = node.parent?.type === 'AwaitExpression' ? node.parent : node;

        const parentType = effective.parent?.type;
        if (parentType !== 'VariableDeclarator' && parentType !== 'AssignmentExpression') {
          context.report({ node, messageId: 'ignored', data: { name: node.callee.name } });
        }
      },
    };
  },
};
