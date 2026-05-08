import ts from 'typescript';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'scriptPath in TypedCallableDefinition must match the file that calls typedMain with it.',
    },
    messages: {
      mismatch:
        'scriptPath "{{scriptPath}}" does not match this file "{{currentPath}}". Update the scriptPath or move the implementation.',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.parserServices ?? context.sourceCode?.parserServices;
    if (!parserServices?.program) return {};

    const checker = parserServices.program.getTypeChecker();

    function getRelativeToSrc(filePath) {
      const marker = '/src/';
      const idx = filePath.lastIndexOf(marker);
      return idx === -1 ? null : filePath.slice(idx + marker.length);
    }

    function resolveScriptPath(esTreeNode) {
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(esTreeNode);
      if (!tsNode) return null;

      let symbol = checker.getSymbolAtLocation(tsNode);
      if (!symbol) return null;

      if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol);
      }

      const decls = symbol.declarations;
      if (!decls?.length) return null;

      const decl = decls[0];
      if (!ts.isVariableDeclaration(decl) || !decl.initializer) return null;

      const init = decl.initializer;
      if (!ts.isObjectLiteralExpression(init)) return null;

      const scriptPathProp = init.properties.find(
        (p) =>
          ts.isPropertyAssignment(p) &&
          ts.isIdentifier(p.name) &&
          p.name.text === 'scriptPath' &&
          ts.isStringLiteral(p.initializer),
      );
      if (!scriptPathProp || !ts.isPropertyAssignment(scriptPathProp)) return null;

      return scriptPathProp.initializer.text;
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'typedMain') return;
        if (node.arguments.length < 1) return;

        const defArg = node.arguments[0];
        const scriptPath = resolveScriptPath(defArg);
        if (scriptPath === null) return;

        const currentFile = context.filename ?? context.getFilename();
        const currentRelative = getRelativeToSrc(currentFile);
        if (!currentRelative) return;

        const normalizedScriptPath = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;

        if (normalizedScriptPath !== currentRelative) {
          context.report({
            node: defArg,
            messageId: 'mismatch',
            data: { scriptPath: normalizedScriptPath, currentPath: currentRelative },
          });
        }
      },
    };
  },
};
