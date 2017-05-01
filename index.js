const fs = require('fs');
const path = require('path');
const process = require('process');
const repl = require('repl');
const _ = require('lodash');
const readPkg = require('read-pkg');
const reqCwd = require('req-cwd');
const chalk = require('chalk');
const isPromise = require('is-promise');

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

function printBanner(context, localPkg) {
  console.log(chalk.gray(`Node ${process.version}, ${pkg.name} ${VERSION}`));
  console.log(chalk.bold.cyan(`${localPkg.name} ${localPkg.version}`));
  console.log('Context:', _.keys(context).sort().join(', '));
}

const contextKey = exports.contextKey = name => _.camelCase(path.parse(name).name);

const loadContext = exports.loadContext = (config) => {
  const configArray = _.isArray(config) ?
    config :
    _.map(config, (value, name) => {
      return { name, value };
    });
  const promise = new Promise((resolve, reject) => {
    const promiseItems = [];
    const ret = {};
    _.forEach(configArray, (item) => {
      // Strings are assumed to be module names
      const isString = _.isString(item);
      const name = isString ? item : item.name;
      if (!name) {
        reject('"name" is required for each context entry.');
      }
      const key = contextKey(name);
      if (!key) {
        reject(`Invalid name "${name}"`);
      }
      const module = isString ? item : item.module;
      const value = isString ? null : item.value;
      if (!module && !value) {
        reject('Context entry must contain either "module" or "value".');
      }
      if (module && value) {
        reject(`Context entry for "${name}" cannot define both "module" and "value".`);
      }
      const contextValue = module ? reqCwd(module) : value;
      if (isPromise(contextValue)) {
        promiseItems.push({ key, promise: contextValue });
      } else {
        ret[key] = contextValue;
      }
    });
    // Resolve all values that are promises, then resolve the context
    Promise.all(_.map(promiseItems, each => each.promise))
      .then((values) => {
        _.forEach(values, (value, i) => {
          ret[promiseItems[i].key] = value;
        });
        resolve(ret);
      }, reject);
  });
  return promise;
};

const loadConfiguration = exports.loadConfiguration = (options) => {
  const pkgPath = options.package || path.join(process.cwd(), 'package.json');
  const replrcPath = options.replrc || path.join(process.cwd(), '.replrc.js');

  const localPkg = fs.existsSync(pkgPath) && options.package !== false ? readPkg.sync(pkgPath) : {};
  const replrc = fs.existsSync(replrcPath) && options.replrc !== false ? reqCwd(replrcPath) : {};

  const pkgContextConfig = _.isArray(localPkg.repl) ? localPkg.repl : _.get(localPkg, 'repl.context', []);
  const replrcContextConfig = _.isArray(replrc) ? replrc : _.get(replrc, 'context', []);
  const prompt = options.prompt || replrc.prompt || _.get(localPkg, 'repl.prompt') || getDefaultPrompt(localPkg.name);
  const promptFunc = _.isString(prompt) ? () => prompt : prompt;

  const banner = options.banner || replrc.banner || _.get(localPkg, 'repl.banner') || printBanner;
  const bannerFunc = _.isString(banner) ? () => console.log(banner) : banner;

  return new Promise((resolve, reject) => {
    Promise.all([
      loadContext(pkgContextConfig),
      loadContext(replrcContextConfig)
    ]).then((contexts) => {
      const pkgContext = contexts[0];
      const replrcContext = contexts[1];
      const context = _.assign({}, pkgContext, replrcContext);
      resolve({
        context,
        prompt,
        promptFunc,
        banner,
        bannerFunc,
        package: localPkg,
      });
    }, reject);
  });
};


/**
 * Start a new repl. Return a promise that resolves to a `REPLServer`
 * instance.
 *
 * Loads configuration from package.json
 * and .repl.js. Takes the same options as the built-in
 * `repl.start` function.
 */
exports.start = (options) => {
  const opts = _.isString(options) ? { prompt: options } : options || {};
  return new Promise((resolve, reject) => {
    loadConfiguration(opts)
      .then((config) => {
        const context = config.context;
        const prompt = config.promptFunc(context, config.package);
        config.bannerFunc(context, config.package);

        const replOpts = _.assign({}, opts, { prompt });
        const replInstance = repl.start(replOpts);
        _.assign(replInstance.context, context);
        resolve(replInstance);
      }, reject);
  });
};
