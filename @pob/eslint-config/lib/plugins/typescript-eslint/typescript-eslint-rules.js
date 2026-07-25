import { enableIfVSCode } from "@pob/eslint-config/utils";

export default {
  name: "@pob/eslint-config/typescript-eslint/rules",

  rules: {
    // https://typescript-eslint.io/rules/adjacent-overload-signatures/
    "@typescript-eslint/adjacent-overload-signatures": "error",

    // https://typescript-eslint.io/rules/array-type/
    "@typescript-eslint/array-type": "error",

    // https://typescript-eslint.io/rules/ban-tslint-comment/
    "@typescript-eslint/ban-tslint-comment": "error",

    // https://typescript-eslint.io/rules/class-literal-property-style/
    "@typescript-eslint/class-literal-property-style": "error",

    // https://typescript-eslint.io/rules/consistent-generic-constructors/
    "@typescript-eslint/consistent-generic-constructors": "error",

    // https://typescript-eslint.io/rules/consistent-indexed-object-style/
    "@typescript-eslint/consistent-indexed-object-style": "error",

    // https://typescript-eslint.io/rules/consistent-type-assertions/
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "allow-as-parameter",
      },
    ],

    // https://typescript-eslint.io/rules/consistent-type-definitions/
    "@typescript-eslint/consistent-type-definitions": "error",

    // https://typescript-eslint.io/rules/consistent-type-exports/
    "@typescript-eslint/consistent-type-exports": "error",

    // https://typescript-eslint.io/rules/consistent-type-imports/
    "@typescript-eslint/consistent-type-imports": "error",

    // https://typescript-eslint.io/rules/explicit-function-return-type/
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        allowFunctionsWithoutTypeParameters: false,
        allowedNames: [],
        allowIIFEs: false,
      },
    ],

    // https://typescript-eslint.io/rules/explicit-member-accessibility/
    "@typescript-eslint/explicit-member-accessibility": "off",

    // https://typescript-eslint.io/rules/explicit-module-boundary-types/
    "@typescript-eslint/explicit-module-boundary-types": "error",

    // https://typescript-eslint.io/rules/method-signature-style/
    "@typescript-eslint/method-signature-style": "error",

    // https://typescript-eslint.io/rules/naming-convention/
    "@typescript-eslint/naming-convention": [
      enableIfVSCode("warn"),
      // Enforce that interface names do not begin with an I
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
      // Enforce that type is in PascalCase
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
    ],

    // https://typescript-eslint.io/rules/no-confusing-non-null-assertion/
    "@typescript-eslint/no-confusing-non-null-assertion": "error",

    // https://typescript-eslint.io/rules/no-import-type-side-effects/
    "@typescript-eslint/no-import-type-side-effects": "error",

    // https://typescript-eslint.io/rules/no-inferrable-types/
    "@typescript-eslint/no-inferrable-types": "error",

    // https://typescript-eslint.io/rules/no-require-imports/
    "@typescript-eslint/no-require-imports": "off",

    // https://typescript-eslint.io/rules/no-unnecessary-qualifier/
    "@typescript-eslint/no-unnecessary-qualifier": "error",

    // https://typescript-eslint.io/rules/no-unsafe-unary-minus/
    "@typescript-eslint/no-unsafe-unary-minus": "error",

    // https://typescript-eslint.io/rules/no-useless-empty-export/
    "@typescript-eslint/no-useless-empty-export": "error",

    // https://typescript-eslint.io/rules/non-nullable-type-assertion-style/
    "@typescript-eslint/non-nullable-type-assertion-style": "error",

    // https://typescript-eslint.io/rules/parameter-properties/
    "@typescript-eslint/parameter-properties": "error",

    // https://typescript-eslint.io/rules/prefer-enum-initializers/
    "@typescript-eslint/prefer-enum-initializers": "error",

    // https://typescript-eslint.io/rules/prefer-find/
    "@typescript-eslint/prefer-find": "error",

    // https://typescript-eslint.io/rules/prefer-for-of/
    "@typescript-eslint/prefer-for-of": "off",

    // https://typescript-eslint.io/rules/prefer-function-type/
    "@typescript-eslint/prefer-function-type": "error",

    // https://typescript-eslint.io/rules/prefer-namespace-keyword/
    "@typescript-eslint/prefer-namespace-keyword": "error",

    // https://typescript-eslint.io/rules/prefer-nullish-coalescing/
    "@typescript-eslint/prefer-nullish-coalescing": "off",

    // https://typescript-eslint.io/rules/prefer-optional-chain/
    "@typescript-eslint/prefer-optional-chain": "error",

    // https://typescript-eslint.io/rules/prefer-readonly/
    "@typescript-eslint/prefer-readonly": "off",

    // https://typescript-eslint.io/rules/prefer-readonly-parameter-types/
    // too verbose and eslint already makes sure we don't modify parameters
    "@typescript-eslint/prefer-readonly-parameter-types": "off",

    // https://typescript-eslint.io/rules/prefer-regexp-exec/
    "@typescript-eslint/prefer-regexp-exec": "error",

    // https://typescript-eslint.io/rules/prefer-string-starts-ends-with/
    "@typescript-eslint/prefer-string-starts-ends-with": "error",

    // https://typescript-eslint.io/rules/promise-function-async/
    "@typescript-eslint/promise-function-async": "off",

    // https://typescript-eslint.io/rules/require-array-sort-compare/
    "@typescript-eslint/require-array-sort-compare": "off",

    // https://typescript-eslint.io/rules/restrict-template-expressions/
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowAny: false,
        allowBoolean: true,
        allowNullish: false,
        allowNumber: true,
        allowRegExp: false,
        allowNever: false,
      },
    ],

    // https://typescript-eslint.io/rules/sort-type-constituents/
    "@typescript-eslint/sort-type-constituents": "error",

    // https://typescript-eslint.io/rules/strict-boolean-expressions/
    "@typescript-eslint/strict-boolean-expressions": "off",

    // https://typescript-eslint.io/rules/switch-exhaustiveness-check/
    "@typescript-eslint/switch-exhaustiveness-check": "error",

    // https://typescript-eslint.io/rules/ban-ts-comment/
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        minimumDescriptionLength: 3,
        "ts-check": true, // default is false. We don't want to use ts-check like ts-nocheck and prefer instead ts-expect-error
        "ts-expect-error": "allow-with-description",
        "ts-ignore": true,
        "ts-nocheck": true,
      },
    ],

    // https://typescript-eslint.io/rules/typedef/
    "@typescript-eslint/typedef": "off",

    /* warnings: not required to be fixed, but should require attention */
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-redundant-type-constituents": "warn",

    /* Disabled */

    // too much errors on existing code
    "@typescript-eslint/unbound-method": "off",

    // most of the time it's sorted by the developer as it is easier to read
    "@typescript-eslint/sort-type-union-intersection-members": "off",

    "@typescript-eslint/member-ordering": "off",
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/no-unnecessary-type-arguments": "off",

    // Testing rules as warn
    "@typescript-eslint/unified-signatures": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/no-confusing-void-expression": "warn",
    "@typescript-eslint/no-unnecessary-type-parameters": "warn",
  },
};
