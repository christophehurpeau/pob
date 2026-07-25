const isVSCode =
  process.argv &&
  process.argv.some((argv) => argv.includes("dbaeumer.vscode-eslint"));

export const enableIfVSCode = (ruleLevel) => (isVSCode ? ruleLevel : "off");
