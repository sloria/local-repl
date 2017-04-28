const fs = require('fs');
const path = require('path');
const process = require('process');
const repl = require('repl');
const _ = require('lodash');
const readPkg = require('read-pkg');
const reqCwd = require('req-cwd');

const pkg = readPkg.sync(path.join(__dirname, 'package.json'));
const VERSION = exports.VERSION = pkg.version;

const getDefaultPrompt = exports.getDefaultPrompt = (projectName) => {
  if (!projectName) {
    return '> ';
  }
  const MAX_LENGTH = 8;
  const name = projectName.length > MAX_LENGTH ? projectName[0] : projectName;
  return `[${name}] > `;
};

function printBanner(context) {
  console.log(`Node ${process.version}`);
  console.log(`prepl v${VERSION}`);
  console.log('Context: ', _.keys(context).sort().join(', '));
}

const loadContext = exports.loadContext = (contextArray) => {
  const ret = {};
  _.forEach(contextArray, (item) => {
    // Strings are assumed to be module names
    const isString = _.isString(item);
    const name = isString ? item : item.name;
    const module = isString ? item : item.module;
    const value = isString ? null : item.value;
    var contextValue;  // eslint-disable-line
    if (module && value) {
      throw new Error('ERROR: Context entry cannot define both "module" and "value".');
    }
    if (module) {
      contextValue = reqCwd(module);
    } else if (value) {
      contextValue = value;
    }
    ret[name] = contextValue;
  });
  return ret;
};

function loadContextWithExit(contextArray) {
  try {
    return loadContext(contextArray);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  return null;
}

const loadConfiguration = exports.loadConfiguration = (options) => {
  const pkgPath = options.package || path.join(process.cwd(), 'package.json');
  const replrcPath = options.replrc || path.join(process.cwd(), '.replrc.js');

  const localPkg = fs.existsSync(pkgPath) && options.package !== false ? readPkg.sync(pkgPath) : {};
  const replrc = fs.existsSync(replrcPath) && options.replrc !== false ? reqCwd(replrcPath) : {};

  const pkgContext = _.isArray(localPkg.repl) ? localPkg.repl : _.get(localPkg, 'repl.context', []);
  const replrcContext = _.isArray(replrc) ? replrc : _.get(replrc, 'context', []);
  const context = _.assign(
    {},
    loadContextWithExit(pkgContext),
    loadContextWithExit(replrcContext)
  );

  const prompt = options.prompt || replrc.prompt || _.get(localPkg, 'repl.prompt') || getDefaultPrompt(localPkg.name);
  return {
    context,
    prompt,
  };
};


/**
 * Starts a new repl.
 *
 * Loads configuration from package.json
 * and .repl.js. Takes the same options as the built-in
 * `repl.start` function.
 */
exports.start = (options) => {
  const opts = options || {};
  const config = loadConfiguration(opts);
  const context = config.context;
  const prompt = config.prompt;
  // TODO: Make configurable
  printBanner(context);

  const replOpts = _.assign({}, opts, { prompt });
  const replInstance = repl.start(replOpts);
  _.assign(replInstance.context, context);
  return replInstance;
};
