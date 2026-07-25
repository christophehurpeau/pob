import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  {
    name: "@pob/eslint-config/unicorn",
    plugins: { unicorn: eslintPluginUnicorn },
    rules: {
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/catch-error-name.md
      "unicorn/catch-error-name": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/explicit-length-check.md
      "unicorn/explicit-length-check": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/filename-case.md
      "unicorn/filename-case": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-abusive-eslint-disable.md
      "unicorn/no-abusive-eslint-disable": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-process-exit.md
      "unicorn/no-process-exit": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/throw-new-error.md
      "unicorn/throw-new-error": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/number-literal-case.md
      "unicorn/number-literal-case": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/escape-case.md
      "unicorn/escape-case": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-buffer.md
      "unicorn/no-new-buffer": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-hex-escape.md
      "unicorn/no-hex-escape": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/custom-error-definition.md
      "unicorn/custom-error-definition": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-starts-ends-with.md
      "unicorn/prefer-string-starts-ends-with": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-type-error.md
      "unicorn/prefer-type-error": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-callback-reference.md
      "unicorn/no-array-callback-reference": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/new-for-builtins.md
      "unicorn/new-for-builtins": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-spread.md
      "unicorn/prefer-spread": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/error-message.md
      "unicorn/error-message": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-add-event-listener.md
      "unicorn/prefer-add-event-listener": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-query-selector.md
      "unicorn/prefer-query-selector": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-append.md
      "unicorn/prefer-dom-node-append": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-remove.md
      "unicorn/prefer-dom-node-remove": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unused-properties.md
      "unicorn/no-unused-properties": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-array-destructuring.md
      "unicorn/no-unreadable-array-destructuring": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-console-spaces.md
      "unicorn/no-console-spaces": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prevent-abbreviations.md
      "unicorn/prevent-abbreviations": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-for-loop.md
      "unicorn/no-for-loop": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-zero-fractions.md
      "unicorn/no-zero-fractions": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-includes.md
      "unicorn/prefer-includes": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-text-content.md
      "unicorn/prefer-dom-node-text-content": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-keyboard-event-key.md
      "unicorn/prefer-keyboard-event-key": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat-map.md
      "unicorn/prefer-array-flat-map": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-keyword-prefix.md
      "unicorn/no-keyword-prefix": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md
      "unicorn/expiring-todo-comments": [
        "error",
        {
          allowWarningComments: true,
        },
      ],

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-nested-ternary.md
      "no-nested-ternary": "off",
      "unicorn/no-nested-ternary": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-function-scoping.md
      "unicorn/consistent-function-scoping": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-reflect-apply.md
      "unicorn/prefer-reflect-apply": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-dataset.md
      "unicorn/prefer-dom-node-dataset": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-slice.md
      "unicorn/prefer-string-slice": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-trim-start-end.md
      "unicorn/prefer-string-trim-start-end": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-negative-index.md
      "unicorn/prefer-negative-index": "error",

      // https://github.com/sindr esorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-modern-dom-apis.md
      "unicorn/prefer-modern-dom-apis": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-replace-all.md
      "unicorn/prefer-string-replace-all": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/string-content.md
      "unicorn/string-content": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-number-properties.md
      "unicorn/prefer-number-properties": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-has.md
      "unicorn/prefer-set-has": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-optional-catch-binding.md
      "unicorn/prefer-optional-catch-binding": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-undefined.md
      "unicorn/no-useless-undefined": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-find.md
      "unicorn/prefer-array-find": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-reduce.md
      "unicorn/no-array-reduce": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/import-style.md
      "unicorn/import-style": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-trunc.md
      "unicorn/prefer-math-trunc": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/numeric-separators-style.md
      "unicorn/numeric-separators-style": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-ternary.md
      "unicorn/prefer-ternary": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-lonely-if.md
      "unicorn/no-lonely-if": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/empty-brace-spaces.md
      "unicorn/empty-brace-spaces": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-date-now.md
      "unicorn/prefer-date-now": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-some.md
      "unicorn/prefer-array-some": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-default-parameters.md
      "unicorn/prefer-default-parameters": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-array.md
      "unicorn/no-new-array": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-index-of.md
      "unicorn/prefer-array-index-of": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md
      "unicorn/prefer-regexp-test": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-destructuring.md
      "unicorn/consistent-destructuring": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-for-each.md
      "unicorn/no-array-for-each": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-single-call.md
      "unicorn/prefer-single-call": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-this-assignment.md
      "unicorn/no-this-assignment": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-static-only-class.md
      "unicorn/no-static-only-class": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat.md
      "unicorn/prefer-array-flat": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-switch.md
      "unicorn/prefer-switch": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md
      "unicorn/prefer-node-protocol": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-module.md
      // unicorn/prefer-module is enabled in node configs.
      "unicorn/prefer-module": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-document-cookie.md
      "unicorn/no-document-cookie": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-array-join-separator.md
      "unicorn/require-array-join-separator": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-number-to-fixed-digits-argument.md
      "unicorn/require-number-to-fixed-digits-argument": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-prototype-methods.md
      "unicorn/prefer-prototype-methods": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-method-this-argument.md
      "unicorn/no-array-method-this-argument": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-post-message-target-origin.md
      "unicorn/require-post-message-target-origin": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-top-level-await.md
      "unicorn/prefer-top-level-await": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-at.md
      "unicorn/prefer-at": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-from-entries.md
      "unicorn/prefer-object-from-entries": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-length-check.md
      "unicorn/no-useless-length-check": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-spread.md
      "unicorn/no-useless-spread": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-fallback-in-spread.md
      "unicorn/no-useless-fallback-in-spread": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-remove-event-listener.md
      "unicorn/no-invalid-remove-event-listener": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/template-indent.md
      // prettier does that
      "unicorn/template-indent": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-empty-file.md
      "unicorn/no-empty-file": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-export-from.md
      "unicorn/prefer-export-from": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-code-point.md
      "unicorn/prefer-code-point": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-await-expression-member.md
      "unicorn/no-await-expression-member": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-thenable.md
      "unicorn/no-thenable": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-promise-resolve-reject.md
      "unicorn/no-useless-promise-resolve-reject": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/relative-url-style.md
      "unicorn/relative-url-style": ["error", "always"],

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-json-parse-buffer.md
      "unicorn/prefer-json-parse-buffer": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/text-encoding-identifier-case.md
      "unicorn/text-encoding-identifier-case": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-native-coercion-functions.md
      "unicorn/prefer-native-coercion-functions": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-iife.md
      "unicorn/no-unreadable-iife": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-modern-math-apis.md
      "unicorn/prefer-modern-math-apis": "warn",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-switch-case.md
      "unicorn/no-useless-switch-case": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-logical-operator-over-ternary.md
      "unicorn/prefer-logical-operator-over-ternary": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-event-target.md
      "unicorn/prefer-event-target": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-await.md
      "unicorn/no-unnecessary-await": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/switch-case-braces.md
      "unicorn/switch-case-braces": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-typeof-undefined.md
      "unicorn/no-typeof-undefined": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-negated-condition.md
      "unicorn/no-negated-condition": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-size.md
      "unicorn/prefer-set-size": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-blob-reading-methods.md
      "unicorn/prefer-blob-reading-methods": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-global-this.md
      "unicorn/prefer-global-this": "warn",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-min-max.md
      "unicorn/prefer-math-min-max": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-existence-index-check.md
      "unicorn/consistent-existence-index-check": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-date-clone.md
      "unicorn/consistent-date-clone": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-assert.md
      "unicorn/consistent-assert": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-builtins.md
      "unicorn/no-instanceof-builtins": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-accessor-recursion.md
      "unicorn/no-accessor-recursion": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-polyfills.md
      "unicorn/no-unnecessary-polyfills": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-slice-end.md
      "unicorn/no-unnecessary-slice-end": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-class-fields.md
      "unicorn/prefer-class-fields": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-reverse.md
      "unicorn/no-array-reverse": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-sort.md
      "unicorn/no-array-sort": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-immediate-mutation.md
      "unicorn/no-immediate-mutation": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-collection-argument.md
      "unicorn/no-useless-collection-argument": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-response-static-json.md
      "unicorn/prefer-response-static-json": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-template-literal-escape.md
      "unicorn/consistent-template-literal-escape": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-iterator-to-array.md
      "unicorn/no-useless-iterator-to-array": "error",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-simple-condition-first.md
      "unicorn/prefer-simple-condition-first": "off",

      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/switch-case-break-position.md
      "unicorn/switch-case-break-position": "error",
    },
  },
];
