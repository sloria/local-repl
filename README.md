# 🐚 local-repl

[![Current Version](https://badgen.net/npm/v/local-repl)](https://www.npmjs.org/package/local-repl)
[![Build Status](https://badgen.net/travis/babel/babel/master)](https://travis-ci.org/sloria/local-repl)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=sloria/local-repl)](https://dependabot.com)

Project-specific REPLs for Node.js. `local-repl` allows you to automatically import modules and values into your REPL sessions with simple configuration in your project's `package.json` and/or `.replrc.js`.

## Features!

- Automatically import modules into your REPL sessions
- Use `await` in the REPL without having to wrap your code in async functions
- Configure the banner and prompt


## Add local-repl to your project

```
$ npm install local-repl --save-dev
# OR
$ yarn add local-repl --dev
```

Add the following to `package.json`. Note: lodash is used as an example
here; it is not required to use local-repl.

```json
{
  "scripts": {
    "repl": "local-repl"
  },
  "devDependencies": {
    "local-repl": "^3.0.0"
  },
  "dependencies": {
    "lodash": "^4.17.4"
  },
  "repl": [
    "lodash"
  ]
}
```

## Run it

```
$ npm run repl
```

This will start a REPL session with `lodash` already imported.

![](media/basic.gif)

## Specifying aliases

You can pass an array of objects containing the keys `"name"` (required), `"module"` (for imports), or `"value"` (for values).

```json
{
  "repl": [
    {"name": "l", "module": "lodash"},
    {"name": "meaningOfLife", "value": 42}
  ]
}
```

![](media/aliases.gif)

## Importing local modules

Local modules can be imported, too.

```json
{
  "repl": [
    {"name": "project", "module": "./"},
    {"name": "utils", "module": "./lib/utils"}
  ]
}
```

## Using `.replrc.js`

Instead of defining configuration in "package.json", you may define your configuration in a `.replrc.js` file. This is useful if you want to dynamically compute modules and values for your REPLs.

```js
// .replrc.js
const User = require('./myapp/models/User');

module.exports = {
  context: [
    'lodash',
    'myapp/utils',
    {name: 'me', value: User.getByEmail('sloria')},
  ]
}
```

**Note**: Configuration defined in `.replrc.js` takes precedence over configuration defined in `package.json`.


## Defining context as an object

Context can be defined as an object rather than an array.

```javascript
// .replrc.js
const User = require('./myapp/models/User');

module.exports ={
  context: {
    l: require('lodash'),
    utils: require('myapp/utils'),
    me: User.getByEmail('sloria'),
  }
}
```

## Promises as context values

Context values that are promises will be resolved before the REPL starts.

```javascript
// .replrc.js
const promise = new Promise((resolve) => {
  setTimeout(() => {
    resolve(42);
  }, 500);
});

module.exports = {
  // REPL will have meaningOfLife with value 42 in context
  context: {
    meaningOfLife: promise,
  }
};
```

## await support

You can use `await` in your REPL sessions without having to
create `async` functions.

![](media/await.gif)

Just add the following to your package.json:

```json
{
  "repl": {
    "enableAwait": true
  }
}
```

Or in `.replrc.js`

```js
// .replrc.js
module.exports = {
  enableAwait: true
}

```

## More configuration

### Configuring the prompt

In package.json:

```json
{
  "repl": {
    "prompt": "myproject $"
  }
}
```

In `.replrc.js`:

```javascript
// .replrc.js
module.exports = {
  prompt: 'myproject $'
}
```

You can also define `prompt` as a function in `.replrc.js`. The function will receive the REPL context and the parsed `package.json` object.

```javascript
// .replrc.js
module.exports = {
  prompt: (context, pkg) => {
    return `${pkg.name} ${pkg.version} $`
  }
}
```

### Configuring the banner

In package.json:

```json
{
  "repl": {
    "banner": "Welcome to the myapp REPL. Happy hacking!"
  }
}
```

You can also define `banner` as a function in `.replrc.js`. The function will receive the REPL context and the parsed `package.json` object.

```javascript
// .replrc.js
const _ = require('lodash');
const chalk = require('chalk');

module.exports = {
  context: [
    {name: 'l', value: _},
    {name: 'meaningOfLife', value: 42},
  ],
  banner: (context, pkg) => {
    console.log(chalk.bold(`Welcome to the REPL for myapp ${pkg.version}.`));
    console.log(chalk.green('Happy hacking!'));
    console.log(chalk.cyan('Context:'), _.keys(context).sort().join(', '));
  }
}
```

![](media/banner.png)

## Programmatic usage

`local-repl` can be used programatically. The `.start(options)` function takes the same options as Node's built-in [`repl.start(options)`](https://nodejs.org/api/repl.html#repl_repl_start_options) and returns a `Promise` that resolves to a `REPLServer` instance.

```javascript
const repl = require('local-repl');

repl.start({ prompt: '< -_- > ' });
```

## Inspiration

`local-repl` is inspired a number of other great projects:

- [konch](https://github.com/sloria/konch) - REPL configuration for Python
- [n_](https://github.com/borisdiakur/n_) - Node.js REPL with lodash

## License

MIT licensed. See [LICENSE](https://github.com/sloria/local-repl/blob/master/LICENSE) for more details.
