'use strict';
/**
 * Simple util console.log method and turn it off during the test
 */
// const chalk = require('chalk');
const gutil = require('gulp-util');
const test = process.env.NODE_ENV === 'test';
const debug = process.env.DEBUG;
// Main
module.exports = function (...args) {
  if (!test && !debug) {
    gutil.log.apply(null, args);
  }
};
