# Changelog

## 4.0.0 (2018-05-06)

* Drop support for Node.js 4.

## 3.1.0 (2017-12-04)

* Use `await` in REPLs without having to wrap your code in `async`
functions. Just set `enableAwait: true` in your config.

## 3.0.1 (2017-12-04)

* Fix installation.

## 3.0.0 (2017-10-08)

* *Backwards-incompatible*: All promise rejections resolve to an `Error`
instance rather than a string.
* Internal refactoring.

## 2.0.1 (2017-04-30)

* Properly handle rejected promises in context.

## 2.0.0 (2017-04-30)

* Allow context values to be `Promise` objects.
* `start`, `loadConfiguration`, and `loadContext` return promises.

## 1.2.0 (2017-04-30)

* `options.banner` passed to `repl.start` takes precedence over configuration defined in `package.json` or `.replrc.js`.
* Fix loading absolute paths into context.
* Throw error if a context item does not contain either `module` or `value`.
* `.start` may receive a string as its first argument (consistent with Node's built-in `repl.start`).

## 1.1.0 (2017-04-29)

* Allow `prompt` to be a function that receives `context` and `package`.
* Allow `context` to be defined as an object (key: value).

## 1.0.0 (2017-04-29)

* First release.
