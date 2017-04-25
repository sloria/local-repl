const fs = require('fs');
const path = require('path');
const process = require('process');
const repl = require('repl');
const _ = require('lodash');
const readPkg = require('read-pkg');
const reqCwd = require('req-cwd');

const replrcPath = path.join(process.cwd(), '.replrc.js');
const replrc = fs.existsSync(replrcPath) ? reqCwd(replrcPath) : {};
const pkg = readPkg.sync(path.join(process.cwd(), 'package.json'));

const DEFAULT_PROMPT = `[${pkg.name}] > `;

const replInstance = repl.start({
  prompt: replrc.prompt || _.get(pkg, 'repl.prompt') || DEFAULT_PROMPT,
});

function addContext(context, newContext) {
  _.forEach(newContext, (item) => {
    var contextValue;  // eslint-disable-line
    const name = item.name;
    const module = item.module;
    const value = item.value;
    if (module && value) {
      console.error('Context entry cannot define both "module" and "value".');
      process.exit(1);
    }
    if (module) {
      contextValue = reqCwd(module);
    } else if (value) {
      contextValue = value;
    }
    // Prevent warning about re-assigning _
    if (name === '_') {
      Object.defineProperty(context, name, {
        configurable: true,
        enumerable: true,
        get: () => contextValue,
      });
    } else {
      context[name] = contextValue;  // eslint-disable-line
    }
  });
}

if (_.has(pkg, 'repl.context')) {
  addContext(replInstance.context, pkg.repl.context);
}

if (_.has(replrc, 'context')) {
  addContext(replInstance.context, replrc.context);
}
