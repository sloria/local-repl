#!/usr/bin/env node
const chalk = require('chalk');

require('./')
  .start()
  .catch(err => {
    console.error(chalk.red(err));
  });
