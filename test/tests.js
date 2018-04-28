import * as path from 'path';
import test from 'ava';

import * as p from '..';

test('getDefaultPrompt: should use short names', t => {
  t.is(p.getDefaultPrompt('foo'), '[foo] > ');
});

test('getDefaultPrompt: should truncate long names', t => {
  const name = 'foobarbazquuuux';
  t.is(p.getDefaultPrompt(name), '[f] > ');
});

test('loadContext: should load values', async t => {
  const context = await p.loadContext([{name: 'foo', value: 42}]);
  t.deepEqual(context, {foo: 42});
});

test('loadContext: should load installed modules', async t => {
  const context = await p.loadContext([{name: 'foo', module: 'lodash'}]);
  t.true(typeof context.foo === 'function');
});

test('loadContext: should load local modules', async t => {
  const context = await p.loadContext([{name: 'foo', module: './test/local-module'}]);
  t.is(context.foo, 'TEST');
});

test('loadContext: should throw an error if both module and value passed', async t => {
  const error = await t.throws(p.loadContext([{name: 'foo', value: 42, module: 'lodash'}]));
  t.is(error.message, 'Context entry for "foo" cannot define both "module" and "value".');
});

test('loadContext: should throw an error if neither module nor value are passed', async t => {
  const error = await t.throws(p.loadContext([{name: 'foo'}]));
  t.is(error.message, 'Context entry must contain either "module" or "value".');
});

test('loadContext: should load strings as modules', async t => {
  const context = await p.loadContext(['lodash']);
  t.true(typeof context.lodash === 'function');
});

test('loadContext: should camelcase local module names', async t => {
  const context = await p.loadContext(['./test/local-module']);
  t.true(Object.prototype.hasOwnProperty.call(context, 'localModule'));
  t.is(context.localModule, 'TEST');
});

test('loadContext: should error if name not provided', async t => {
  const error = await t.throws(p.loadContext([{value: 42}]));
  t.is(error.message, '"name" is required for each context entry.');
});

test('loadContext: should not accept ./', async t => {
  const error = await t.throws(p.loadContext(['./']));
  t.is(error.message, 'Invalid name "./"');
});

test('loadContext: should load key value pairs', async t => {
  const context = await p.loadContext({foo: 42});
  t.deepEqual(context, {foo: 42});
});

test('loadContext: should load promises with context array', async t => {
  const promise = Promise.resolve(42);
  const context = await p.loadContext([{name: 'meaning', value: promise}]);
  t.deepEqual(context, {meaning: 42});
});

test('loadContext: should load promises with context object', async t => {
  const promise = Promise.resolve(42);
  const context = await p.loadContext({meaning: promise});
  t.deepEqual(context, {meaning: 42});
});

test('loadContext: should handle rejected promises', async t => {
  const promise = new Promise((resolve, reject) => {
    reject(new Error('ERROR'));
  });
  const err = await t.throws(p.loadContext({err: promise}));
  t.is(err.message, 'ERROR');
});

test('loadConfiguration: should load config from package.json', async t => {
  const {context, prompt, bannerFunc} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg.json'),
    replrc: false,
  });
  t.deepEqual(context, {bar: 42});
  t.is(prompt, '<TEST> $');
  t.true(typeof bannerFunc === 'function');
});

test('loadConfiguration: should allow "repl" config to be an array in package.json', async t => {
  const {context, prompt, bannerFunc} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg-with-repl-array.json'),
    replrc: false,
  });
  t.is(context.bar, 42);
  t.is(prompt, '[foo] > ');
  t.true(typeof bannerFunc === 'function');
  t.true(typeof context.lodash === 'function');
});

test('loadConfiguration: should allow "repl" config to be an array in replrc', async t => {
  const {context} = await p.loadConfiguration({
    package: false,
    replrc: path.join(__dirname, 'replrc-with-array.js'),
  });
  t.is(context.bar, 43);
  t.true(typeof context.lodash === 'function');
});

test('loadConfiguration: should load config from a replrc file', async t => {
  const {context, prompt} = await p.loadConfiguration({
    package: false,
    replrc: path.join(__dirname, 'replrc.js'),
  });
  t.is(context.bar, 43);
  t.true(typeof context.lodash === 'function');
  t.is(prompt, '[TEST] $');
});

test('loadConfiguration: should give precedence to replrc file', async t => {
  const {context, bannerFunc} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg.json'),
    replrc: path.join(__dirname, 'replrc.js'),
  });
  t.is(context.bar, 43);
  t.true(typeof context.lodash === 'function');
  const banner = bannerFunc();
  t.is(banner, 'TEST');
});

test('loadConfiguration: should allow prompts to be defined as a function', async t => {
  const {context, promptFunc, package: pkg} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg.json'),
    replrc: path.join(__dirname, 'replrc-with-prompt-func.js'),
  });
  t.is(context.foo, 'TEST');
  t.true(typeof promptFunc === 'function');
  t.is(promptFunc(context, pkg), 'TEST foo > ');
});

test('loadConfiguration: should allow context to be an object', async t => {
  const {context} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg.json'),
    replrc: path.join(__dirname, 'replrc-with-context-obj.js'),
  });
  t.true(typeof context.l === 'function');
  t.is(context.meaningOfLife, 42);
});

test('loadConfiguration: should give precedence to passed options', async t => {
  const {prompt, banner} = await p.loadConfiguration({
    package: path.join(__dirname, 'pkg.json'),
    replrc: path.join(__dirname, 'replrc.js'),
    prompt: 'override > ',
    banner: 'OVERRIDE',
  });
  t.is(prompt, 'override > ');
  t.is(banner, 'OVERRIDE');
});

test('contextKey: should camelcase local paths with dashes', t => {
  t.is(p.contextKey('./utils/foo-bar'), 'fooBar');
  t.is(p.contextKey('/utils/foo-bar'), 'fooBar');
});

test('contextKey: should camelcase snakecase names', t => {
  t.is(p.contextKey('./utils/foo_bar'), 'fooBar');
});

test('contextKey: should camelcase package names with dashes', t => {
  t.is(p.contextKey('foo-bar'), 'fooBar');
});
