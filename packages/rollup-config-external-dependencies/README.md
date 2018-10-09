# rollup-config-external-dependencies

## Usage

```
const pkg = require('./package.json');

const external = configExternalDependencies(pkg);

module.exports = {
  input: ...,
  output: ...,
  external,
  plugins: [
    ...
  ]
};
```
