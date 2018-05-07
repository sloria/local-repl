'use strict';
const fs = require('fs');
const path = require('path');
const process = require('process');
const repl = require('repl');
const _ = require('lodash');
const readPkg = require('read-pkg');
const reqCwd = require('req-cwd');
const chalk = require('chalk');
const pProps = require('p-props');
const {addAwaitOutsideToReplServer} = require('await-outside');

const pkg = readPkg.sync(path.join(__dirname, 'package.json'));
const VERSION = (exports.VERSION = pkg.version);

const getDefaultPrompt = (exports.getDefaultPrompt = projectName => {
  if (!projectName) {
    return '> ';
  }
  const MAX_LENGTH = 8;
  const name = projectName.length > MAX_LENGTH ? projectName[0] : projectName;
  return `[${name}] > `;
});

function printBanner(context, localPkg) {
  console.log(chalk.gray(`Node ${process.version}, ${pkg.name} ${VERSION}`));
  console.log(chalk.bold.cyan(`${localPkg.name} ${localPkg.version}`));
  console.log(
    'Context:',
    Object.keys(context)
      .sort()
      .join(', ')
  );
}

const contextKey = (exports.contextKey = name =>
  _.camelCase(path.parse(name).name));

const loadContext = (exports.loadContext = config => {
  return new Promise((resolve, reject) => {
    if (Array.isArray(config)) {
      const ret = {};
      config.forEach(item => {
        // Strings are assumed to be module names
        const isString = typeof item === 'string';
        const name = isString ? item : item.name;
        if (!name) {
          reject(new Error('"name" is required for each context entry.'));
        }
        const key = contextKey(name);
        if (!key) {
          reject(new Error(`Invalid name "${name}"`));
        }
        const module = isString ? item : item.module;
        const value = isString ? null : item.value;
        if (!module && !value) {
          reject(
            new Error('Context entry must contain either "module" or "value".')
          );
        }
        if (module && value) {
          reject(
            new Error(
              `Context entry for "${name}" cannot define both "module" and "value".`
            )
          );
        }
        const contextValue = module ? reqCwd(module) : value;
        ret[key] = contextValue;
      });
      // Resolve all values that are promises, then resolve the context
      pProps(ret).then(resolve, reject);
    } else {
      // config is an object mapping names to values or promises
      pProps(config).then(resolve, reject);
    }
  });
});

const loadConfiguration = (exports.loadConfiguration = options => {
  const pkgPath = options.package || path.join(process.cwd(), 'package.json');
  const replrcPath = options.replrc || path.join(process.cwd(), '.replrc.js');

  const localPkg =
    fs.existsSync(pkgPath) && options.package !== false
      ? readPkg.sync(pkgPath)
      : {};
  const replrc =
    fs.existsSync(replrcPath) && options.replrc !== false
      ? reqCwd(replrcPath)
      : {};

  const pkgContextConfig = Array.isArray(localPkg.repl)
    ? localPkg.repl
    : _.get(localPkg, 'repl.context', []);
  const replrcContextConfig = Array.isArray(replrc)
    ? replrc
    : _.get(replrc, 'context', []);
  const prompt =
    options.prompt ||
    replrc.prompt ||
    _.get(localPkg, 'repl.prompt') ||
    getDefaultPrompt(localPkg.name);
  const promptFunc = typeof prompt === 'string' ? () => prompt : prompt;

  const banner =
    options.banner ||
    replrc.banner ||
    _.get(localPkg, 'repl.banner') ||
    printBanner;
  const bannerFunc =
    typeof banner === 'string' ? () => console.log(banner) : banner;

  const enableAwait =
    options.enableAwait ||
    replrc.enableAwait ||
    _.get(localPkg, 'repl.enableAwait', false);

  return new Promise((resolve, reject) => {
    Promise.all([
      loadContext(pkgContextConfig),
      loadContext(replrcContextConfig),
    ]).then(([pkgContext, replrcContext]) => {
      const context = Object.assign({}, pkgContext, replrcContext);
      resolve({
        context,
        prompt,
        promptFunc,
        banner,
        bannerFunc,
        enableAwait,
        package: localPkg,
      });
    }, reject);
  });
});

/**
 * Start a new repl. Return a promise that resolves to a `REPLServer`
 * instance.
 *
 * Loads configuration from package.json
 * and .repl.js. Takes the same options as the built-in
 * `repl.start` function.
 *
 * @param {object} options: Same options as repl.start.
 * @returns {Promise} A promise to a repl server instance.
 */
exports.start = options => {
  const opts = typeof options === 'string' ? {prompt: options} : options || {};
  return new Promise((resolve, reject) => {
    loadConfiguration(
      opts
    ).then(({context, package: pkg, promptFunc, bannerFunc, enableAwait}) => {
      const prompt = promptFunc(context, pkg);
      bannerFunc(context, pkg);

      const replOpts = Object.assign({}, opts, {prompt});
      const replInstance = repl.start(replOpts);
      Object.assign(replInstance.context, context);
      if (enableAwait) {
        addAwaitOutsideToReplServer(replInstance);
      }
      resolve(replInstance);
    }, reject);
  });
};
