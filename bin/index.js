/* eslint-disable */
// #!/usr/bin/env node
'use strict';
/**
 * The cli
 */
const webServerIO = require('../src/main.js');
const chalk = require('chalk');
const root = process.cwd();
// Remember this need to run within gulp
// so first thing to check is to see if I could call gulp first?
/*
try {
  const gulp = require('gulp');
} catch (e) {
  console.log(
    chalk.red('Gulp not found!')
  );
  process.exit();
}
*/
// Check if there is a config file somewhere

// Should I use argv here as well just to detect an option
try {
  const argvs = process.argv;
  const fileName = argvs.map( (arg , i) => {
    if (arg ==='--config') {
      return argvs[i+1];
    }
    return null;
  }).reduce( (last , next) =>
  {
    if (next) {
      console.log(next);
    }

  } , null);


} catch (e) {
  console.log(
    chalk.red('No configuration found, create a wbio-config.json or use the --config option!')
  );
  process.exit();
}
