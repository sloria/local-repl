#!/usr/bin/env node
const chalk = require('chalk');

require('./').start().catch((message) => {
  console.error(chalk.red(message));
});
