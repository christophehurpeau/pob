import confusingBrowserGlobals from "confusing-browser-globals";

export default {
  name: "@pob/eslint-config/best-practices",
  rules: {
    // https://eslint.org/docs/rules/accessor-pairs
    "accessor-pairs": "off",

    // https://eslint.org/docs/rules/array-callback-return
    "array-callback-return": "error",

    // https://eslint.org/docs/rules/block-scoped-var
    "block-scoped-var": "error",

    // http://eslint.org/docs/rules/class-methods-use-this
    "class-methods-use-this": "off",

    // https://eslint.org/docs/rules/constructor-super
    "constructor-super": "error",

    // http://eslint.org/docs/rules/consistent-return
    "consistent-return": "off",

    // http://eslint.org/docs/rules/default-case
    "default-case": ["error", { commentPattern: "^no default$" }],

    // http://eslint.org/docs/rules/default-case-last
    "default-case-last": "error",

    // https://eslint.org/docs/rules/default-param-last
    "default-param-last": "error",

    // https://eslint.org/docs/rules/dot-notation
    "dot-notation": ["error", { allowKeywords: true }],

    // https://eslint.org/docs/rules/eqeqeq
    eqeqeq: ["error", "always", { null: "ignore" }],

    // https://eslint.org/docs/rules/grouped-accessor-pairs
    "grouped-accessor-pairs": "error",

    // https://eslint.org/docs/rules/guard-for-in
    "guard-for-in": "error",

    // https://eslint.org/docs/rules/max-classes-per-file
    "max-classes-per-file": "off",

    // https://eslint.org/docs/rules/max-params
    "max-params": "warn",

    // require a capital letter for constructors
    // https://eslint.org/docs/rules/new-cap
    "new-cap": [
      "error",
      {
        newIsCap: true,
        newIsCapExceptions: [],
        capIsNew: false,
        capIsNewExceptions: [
          "Immutable.Map",
          "Immutable.Set",
          "Immutable.List",
        ],
      },
    ],

    // https://eslint.org/docs/rules/no-alert
    "no-alert": "error",

    // https://eslint.org/docs/rules/no-array-constructor
    "no-array-constructor": "error",

    // https://eslint.org/docs/rules/no-buffer-constructor
    "no-buffer-constructor": "error",

    // https://eslint.org/docs/rules/no-bitwise
    "no-bitwise": "error",

    // https://eslint.org/docs/rules/no-caller
    "no-caller": "error",

    // https://eslint.org/docs/rules/no-case-declarations
    "no-case-declarations": "error",

    // https://eslint.org/docs/rules/no-constructor-return
    "no-constructor-return": "error",

    // https://eslint.org/docs/rules/no-continue
    "no-continue": "off",

    // https://eslint.org/docs/rules/no-class-assign
    "no-class-assign": "error",

    // https://eslint.org/docs/rules/no-const-assign
    "no-const-assign": "error",

    // https://eslint.org/docs/rules/no-dupe-class-members
    "no-dupe-class-members": "error",

    // https://eslint.org/docs/rules/no-empty-function
    "no-empty-function": [
      "error",
      {
        allow: ["arrowFunctions", "functions", "methods"],
      },
    ],

    // https://eslint.org/docs/rules/no-empty-pattern
    "no-empty-pattern": "error",

    // https://eslint.org/docs/latest/rules/no-empty-static-block
    "no-empty-static-block": "error",

    // https://eslint.org/docs/rules/no-eq-null
    "no-eq-null": "off",

    // https://eslint.org/docs/rules/no-eval
    "no-eval": "error",

    // https://eslint.org/docs/rules/no-extend-native
    "no-extend-native": "error",

    // https://eslint.org/docs/rules/no-extra-bind
    "no-extra-bind": "error",

    // https://eslint.org/docs/rules/no-extra-label
    "no-extra-label": "error",

    // https://eslint.org/docs/rules/no-fallthrough
    "no-fallthrough": "error",

    // https://eslint.org/docs/rules/no-floating-decimal
    "no-floating-decimal": "error",

    // https://eslint.org/docs/rules/no-global-assign
    "no-global-assign": "error",

    // https://eslint.org/docs/rules/no-implicit-globals
    // TODO to enable
    "no-implicit-globals": "warn",

    // https://eslint.org/docs/rules/no-implied-eval
    "no-implied-eval": "error",

    // https://eslint.org/docs/rules/no-labels
    "no-labels": ["error", { allowLoop: false, allowSwitch: false }],

    // https://eslint.org/docs/rules/no-label-var
    "no-label-var": "error",

    // https://eslint.org/docs/rules/no-lone-blocks
    "no-lone-blocks": "error",

    // https://eslint.org/docs/rules/no-lonely-if
    "no-lonely-if": "error",

    // https://eslint.org/docs/rules/no-loop-func
    "no-loop-func": "error",

    // https://eslint.org/docs/rules/no-mixed-operators
    "no-mixed-operators": [
      "error",
      {
        // the list of arithmetic groups disallows mixing `%` and `**`
        // with other arithmetic operators.
        groups: [
          ["%", "**"],
          ["%", "+"],
          ["%", "-"],
          ["%", "*"],
          ["%", "/"],
          ["/", "*"],
          ["&", "|", "<<", ">>", ">>>"],
          ["==", "!=", "===", "!=="],
          ["&&", "||"],
        ],
        allowSamePrecedence: false,
      },
    ],

    // https://eslint.org/docs/rules/no-multi-assign
    "no-multi-assign": "error",

    // https://eslint.org/docs/rules/no-multi-str
    "no-multi-str": "error",

    // https://eslint.org/docs/rules/no-nested-ternary
    "no-nested-ternary": "error",

    // https://eslint.org/docs/rules/no-new
    "no-new": "error",

    // https://eslint.org/docs/rules/no-new-func
    "no-new-func": "error",

    // https://eslint.org/docs/rules/no-new-object
    "no-new-object": "error",

    // disallow use of new operator with the require function
    "no-new-require": "error",

    // https://eslint.org/docs/rules/no-new-wrappers
    "no-new-wrappers": "error",

    // https://eslint.org/docs/rules/no-new-native-nonconstructor
    "no-new-native-nonconstructor": "error",

    // https://eslint.org/docs/rules/no-nonoctal-decimal-escape
    "no-nonoctal-decimal-escape": "error",

    // https://eslint.org/docs/rules/no-octal
    "no-octal": "error",

    // https://eslint.org/docs/rules/no-octal-escape
    "no-octal-escape": "error",

    // rule: https://eslint.org/docs/rules/no-param-reassign.html
    "no-param-reassign": "off",

    // https://eslint.org/docs/rules/no-plusplus
    "no-plusplus": "off",

    // https://eslint.org/docs/rules/no-proto
    "no-proto": "error",

    // https://eslint.org/docs/rules/no-redeclare
    "no-redeclare": "error",

    // https://eslint.org/docs/rules/no-restricted-globals
    "no-restricted-globals": [
      "error",
      {
        name: "isFinite",
        message:
          "Use Number.isFinite instead https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite",
      },
      {
        name: "isNaN",
        message:
          "Use Number.isNaN instead https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN",
      },
      ...confusingBrowserGlobals.map((g) => ({
        name: g,
        message: `Use window.${g} instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md`,
      })),
    ],

    // https://eslint.org/docs/rules/no-restricted-properties
    "no-restricted-properties": [
      "error",
      {
        object: "global",
        property: "isFinite",
        message: "Use Number.isFinite instead",
      },
      {
        object: "self",
        property: "isFinite",
        message: "Use Number.isFinite instead",
      },
      {
        object: "window",
        property: "isFinite",
        message: "Use Number.isFinite instead",
      },
      {
        object: "global",
        property: "isNaN",
        message: "Use Number.isNaN instead",
      },
      {
        object: "self",
        property: "isNaN",
        message: "Use Number.isNaN instead",
      },
      {
        object: "window",
        property: "isNaN",
        message: "Use Number.isNaN instead",
      },
      {
        property: "__defineGetter__",
        message: "Use Object.defineProperty instead.",
      },
      {
        property: "__defineSetter__",
        message: "Use Object.defineProperty instead.",
      },
    ],

    // https://eslint.org/docs/rules/no-return-assign
    "no-return-assign": ["error", "always"],

    // https://eslint.org/docs/rules/no-return-await
    "no-return-await": "error",

    // https://eslint.org/docs/rules/no-script-url
    "no-script-url": "error",

    // https://eslint.org/docs/rules/no-self-assign
    "no-self-assign": [
      "error",
      {
        props: true,
      },
    ],

    // https://eslint.org/docs/rules/no-self-compare
    "no-self-compare": "error",

    // https://eslint.org/docs/rules/no-sequences
    "no-sequences": "error",

    // disallow shadowing of names such as arguments
    "no-shadow-restricted-names": "error",

    // https://eslint.org/docs/rules/no-this-before-super
    "no-this-before-super": "error",

    // https://eslint.org/docs/rules/no-throw-literal
    "no-throw-literal": "error",

    // https://eslint.org/docs/rules/no-undef
    "no-undef": "error",

    // https://eslint.org/docs/rules/no-undef-init
    "no-undef-init": "error",

    // https://eslint.org/docs/rules/no-unneeded-ternary
    "no-unneeded-ternary": ["error", { defaultAssignment: false }],

    // https://eslint.org/docs/rules/no-unused-expressions
    "no-unused-expressions": [
      "error",
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false,
      },
    ],

    // https://eslint.org/docs/rules/no-unused-labels
    "no-unused-labels": "error",

    // https://eslint.org/docs/rules/no-unused-vars
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "none",
        caughtErrors: "none",
        ignoreRestSiblings: true,
      },
    ],

    // https://eslint.org/docs/rules/no-use-before-define
    "no-use-before-define": [
      "error",
      { functions: true, classes: true, variables: true },
    ],

    // https://eslint.org/docs/rules/no-useless-catch
    "no-useless-catch": "error",

    // https://eslint.org/docs/rules/no-useless-concat
    "no-useless-concat": "error",

    // https://eslint.org/docs/rules/no-useless-computed-key
    "no-useless-computed-key": "error",

    // https://eslint.org/docs/rules/no-useless-constructor
    "no-useless-constructor": "error",

    // https://eslint.org/docs/rules/no-useless-escape
    "no-useless-escape": "error",

    // https://eslint.org/docs/rules/no-useless-rename
    "no-useless-rename": [
      "error",
      {
        ignoreDestructuring: false,
        ignoreImport: false,
        ignoreExport: false,
      },
    ],

    // https://eslint.org/docs/rules/no-useless-return
    "no-useless-return": "error",

    // https://eslint.org/docs/rules/no-var
    "no-var": "error",

    // https://eslint.org/docs/rules/no-void
    "no-void": "error",

    // https://eslint.org/docs/rules/no-with
    "no-with": "error",

    // https://eslint.org/docs/rules/object-shorthand
    "object-shorthand": [
      "error",
      "always",
      {
        ignoreConstructors: false,
        avoidQuotes: true,
      },
    ],

    // https://eslint.org/docs/rules/prefer-arrow-callback
    "prefer-arrow-callback": [
      "error",
      {
        allowNamedFunctions: false,
        allowUnboundThis: true,
      },
    ],

    // https://eslint.org/docs/rules/prefer-const
    "prefer-const": [
      "error",
      {
        destructuring: "any",
        ignoreReadBeforeAssign: true,
      },
    ],

    // https://eslint.org/docs/rules/prefer-exponentiation-operator
    "prefer-exponentiation-operator": "error",

    // https://eslint.org/docs/rules/prefer-numeric-literals
    "prefer-numeric-literals": "error",

    // https://eslint.org/docs/rules/prefer-object-has-own
    "prefer-object-has-own": "error",

    // https://eslint.org/docs/rules/prefer-object-spread
    "prefer-object-spread": "error",

    // https://eslint.org/docs/rules/prefer-promise-reject-errors
    "prefer-promise-reject-errors": ["error", { allowEmptyReject: true }],

    // https://eslint.org/docs/rules/prefer-regex-literals
    "prefer-regex-literals": [
      "error",
      {
        disallowRedundantWrapping: true,
      },
    ],

    // https://eslint.org/docs/rules/prefer-rest-params
    "prefer-rest-params": "error",

    // https://eslint.org/docs/rules/prefer-spread
    "prefer-spread": "error",

    // https://eslint.org/docs/rules/prefer-template
    "prefer-template": "error",

    // https://eslint.org/docs/rules/radix
    radix: "error",

    // https://eslint.org/docs/rules/require-await
    "require-await": "error",

    // https://eslint.org/docs/rules/require-yield
    "require-yield": "error",

    // https://eslint.org/docs/rules/symbol-description
    "symbol-description": "error",

    // https://eslint.org/docs/rules/template-curly-spacing
    "template-curly-spacing": "error",

    // https://eslint.org/docs/rules/unicode-bom
    "unicode-bom": ["error", "never"],

    // https://eslint.org/docs/rules/yoda
    yoda: "error",

    // Allow for-of, now supported by node 6 and modern browsers
    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
      },
      // => allow 'ForOfStatement',
      // {
      //   selector: 'ForOfStatement',
      //   message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
      // },
      {
        selector: "LabeledStatement",
        message:
          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],
  },
};
