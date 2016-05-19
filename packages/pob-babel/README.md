# pob-babel

Build and watch with babel

### Install

```sh
npm install --save-dev pob-babel
```

Create .pobrc.js

```js
module.exports = {
  react: false,
  envs: ['es5', 'node5', 'node6', 'webpack', 'webpack-modern-browsers'],
};
```

### How to use

#### Direct use

```
node_modules/.bin/pob-build
node_modules/.bin/pob-watch
```

#### With npm scripts `npm run build`

Edit your package.json:

```json
{
    "scripts": {
        "build": "pob-build",
        "watch": "pob-watch"
    }
}

```
