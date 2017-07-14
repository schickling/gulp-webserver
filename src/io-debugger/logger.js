'use strict';
/**
 * This will be the logger method
 */
const fs = require('fs');
const util = require('util');
const path = require('path');
const chalk = require('chalk');
const logutil = require('../lib/log.js');

/**
 * Built-in logging method
 */
module.exports = function (data) {
  const time = new Date();
  const fileName = [
    [
      time.getTime(),
      time.getMilliseconds()
    ].join('-'),
    'log'
  ].join('.');
  const logFile = path.join(process.cwd(), 'logs', fileName);
  fs.writeFile(logFile, util.inspect(data, false, 2), err => {
    if (err) {
      logutil(
        chalk.red(
          'ERROR WRITING TO LOG FILE: ' + logFile
        )
      );
    }
  });
};

// -- EOF --
