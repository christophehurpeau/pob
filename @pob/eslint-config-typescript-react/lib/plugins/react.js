import reactPlugin from "eslint-plugin-react";

export default [
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    rules: {
      // https://github.com/airbnb/javascript/issues/2829
      "func-names": "error",

      // legacy prop-types. We use TypeScript for type checking.
      "react/prop-types": "off",

      // Enforce event handler naming conventions in JSX
      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-handler-names.md
      // 'react/jsx-handler-names': [
      //   'error',
      //   {
      //     eventHandlerPrefix: 'handle',
      //     eventHandlerPropPrefix: 'on',
      //   },
      // ],

      // Prevent direct mutation of this.state
      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-direct-mutation-state.md
      "react/no-direct-mutation-state": "error",

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/button-has-type.md
      "react/button-has-type": "error",

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
      "react/destructuring-assignment": [
        "error",
        "always",
        { ignoreClassFields: false, destructureInSignature: "always" },
      ],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/display-name.md
      "react/display-name": "off",

      "react/function-component-definition": [
        "error",
        {
          namedComponents: ["function-declaration"],
          // https://github.com/airbnb/javascript/issues/2829
          unnamedComponents: ["function-expression"],
        },
      ],

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/hook-use-state.md
      "react/hook-use-state": "error",

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md
      "react/jsx-boolean-value": ["error", "never", { always: [] }],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-brace-presence.md
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-newline.md
      "react/jsx-curly-newline": "off",

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-fragments.md
      "react/jsx-fragments": ["error", "syntax"],

      // https://github.com/yannickcr/eslint-plugin-react/blob/e2eaadae316f9506d163812a09424eb42698470a/docs/rules/jsx-no-constructed-context-values.md
      "react/jsx-no-constructed-context-values": "error",

      // Prevent usage of `javascript:` URLs
      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-script-url.md
      "react/jsx-no-script-url": [
        "error",
        [
          {
            name: "Link",
            props: ["to"],
          },
        ],
      ],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-undef.md
      "react/jsx-no-undef": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-useless-fragment.md
      "react/jsx-no-useless-fragment": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
      "react/jsx-pascal-case": [
        "error",
        {
          allowAllCaps: true,
          ignore: [],
        },
      ],
      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md
      "react/jsx-sort-props": [
        "error",
        {
          noSortAlphabetically: true,
          reservedFirst: true,
          shorthandFirst: true,
          callbacksLast: true,
        },
      ],
      // https://github.com/yannickcr/eslint-plugin-react/blob/21e01b61af7a38fc86d94f27eb66cda8054582ed/docs/rules/no-arrow-function-lifecycle.md
      "react/no-arrow-function-lifecycle": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-array-index-key.md
      "react/no-array-index-key": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/21e01b61af7a38fc86d94f27eb66cda8054582ed/docs/rules/no-invalid-html-attribute.md
      "react/no-invalid-html-attribute": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/8785c169c25b09b33c95655bf508cf46263bc53f/docs/rules/no-namespace.md
      "react/no-namespace": "error",

      // entities does not need to be escaped as color syntaxing makes it clear when it's a body or it's a property.
      "react/no-unescaped-entities": "off",

      // https://github.com/yannickcr/eslint-plugin-react/blob/c2a790a3472eea0f6de984bdc3ee2a62197417fb/docs/rules/no-unstable-nested-components.md
      "react/no-unstable-nested-components": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/8785c169c25b09b33c95655bf508cf46263bc53f/docs/rules/prefer-exact-props.md
      "react/prefer-exact-props": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-es6-class.md
      "react/prefer-es6-class": ["error", "always"],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-stateless-function.md
      "react/prefer-stateless-function": [
        "error",
        { ignorePureComponents: true },
      ],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/self-closing-comp.md
      "react/self-closing-comp": "error",

      // https://github.com/yannickcr/eslint-plugin-react/blob/843d71a432baf0f01f598d7cf1eea75ad6896e4b/docs/rules/sort-comp.md
      "react/sort-comp": [
        "error",
        {
          order: [
            "static-variables",
            "static-methods",
            "instance-variables",
            "lifecycle",
            "getters",
            "setters",
            "instance-methods",
            "/^(on|handle).+$/",
            "everything-else",
            "rendering",
          ],
          groups: {
            lifecycle: [
              "state",
              "constructor",
              "getDerivedStateFromProps",
              "componentWillMount",
              "UNSAFE_componentWillMount",
              "componentDidMount",
              "componentWillReceiveProps",
              "UNSAFE_componentWillReceiveProps",
              "shouldComponentUpdate",
              "componentWillUpdate",
              "UNSAFE_componentWillUpdate",
              "getSnapshotBeforeUpdate",
              "componentDidUpdate",
              "componentDidCatch",
              "componentWillUnmount",
            ],
            rendering: ["/^render.+$/", "render"],
          },
        },
      ],

      // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md
      "react/sort-prop-types": [
        "error",
        {
          noSortAlphabetically: true,
          requiredFirst: false,
          callbacksLast: true,
        },
      ],
    },
  },
];
