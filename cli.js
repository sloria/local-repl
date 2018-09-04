#!/usr/bin/env node
const chalk = require('chalk');

require('.')
  .start()
  .catch(error => {
    console.error(chalk.red(error));
  });
