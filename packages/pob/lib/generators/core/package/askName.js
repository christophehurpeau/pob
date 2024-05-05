import validatePackageName from "validate-npm-package-name";

const defaults = {
  message: "Module Name",
  validate() {
    return true;
  },
};

const ucFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const askName = (prompt, inquirer) => {
  if (typeof prompt === "string") {
    prompt = {
      name: prompt,
    };
  }

  const prompts = [
    {
      ...defaults,
      ...prompt,
      validate(...args) {
        const val = args[0];
        const packageNameValidity = validatePackageName(val);

        if (packageNameValidity.validForNewPackages) {
          const validate = prompt.validate || defaults.validate;

          return validate.apply(this, args);
        }

        return (
          ucFirst(packageNameValidity.errors[0]) ||
          "The provided value is not a valid npm package name"
        );
      },
    },
    // {
    //   type: 'confirm',
    //   name: 'askAgain',
    //   message: 'The name above already exists on npm, choose another?',
    //   default: true,
    //   when(answers) {
    //     return npmName(answers[prompt.name]).then((available) => {
    //       return !available;
    //     });
    //   },
    // },
  ];

  return inquirer.prompt(prompts).then((props) => {
    if (props.askAgain) {
      return askName(prompt, inquirer);
    }

    return props;
  });
};
