# Changelog

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
