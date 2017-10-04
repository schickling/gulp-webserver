#!/usr/bin/env node
'use strict';
/**
 * The cli
 */
const webServerIO = require('../src/main.js');
const chalk = require('chalk');
const root = process.cwd();
// Remember this need to run within gulp
// so first thing to check is to see if I could call gulp first?
try {
  const gulp = require('gulp');
} catch (e) {
  console.log(
    chalk.red('Gulp not found!')
  );
  process.exit();
}
// Check if there is a config file somewhere


// Should I use argv here as well just to detect an option
try {
  const argvs = process.argv;

  console.log(argvs);

} catch(e) {
  console.log(
    chalk.red('No configuration found, create a wbio-config.json or use the --config option!')
  );
  process.exit();
}
