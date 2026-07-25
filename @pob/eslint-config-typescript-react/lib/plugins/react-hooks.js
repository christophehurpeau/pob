import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },

    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
