# brepl

A **B**etter **REPL** for Node.js.


## Usage

Add the following to `package.json`.

```json
{
  "devDependencies": {
    "brepl": "~0.1.0"
  }
  "scripts": {
    "repl": "npm run brepl"
  }
  "repl": {
    "context": [
      "lodash",
      "myapp/utils"
    ]
  }
}
```


## Using `.replrc`

For more control, you can define your configuration in a `.replrc.js` file.

Add a `.replrc.js` file.

```js
module.exports = {
  'context': [
    'lodash',
    'myapp/utils',
  ]
}
```

You can also specify aliases for the imports.

```js
module.exports = {
  'context': [
    {name: '_', module: require('lodash')},
    {name: 'u', module: require('myapp/utils')},
  ]
}
```

