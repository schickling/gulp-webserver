'use strict';
/**
 * Move some of the functions out of the main.js to reduce the complexity
 */
const open = require('open');
const chalk = require('chalk');
const logutil = require('./log.js');
/**
 * Get a random integer between two numbers
 * @param {int} min
 * @param {int} max
 */
exports.getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
/**
 * @param {mixed} opt
 */
const isString = function (opt) {
  return (typeof opt === 'string');
};

/**
 * Encap the whole open method into a function to call
 * @param {object} config
 */
exports.openInBrowser = config => {
  let urlToOpen = '';
  return () => {
    if (config.open === false) {
      return;
    }
    let openMsg = '[Open ';
    if (typeof config.open === 'string' && config.open.indexOf('http') === 0) {
      // If this is a complete url form
      const browser = config.browser || '';
      openMsg += config.open;
      if (browser !== '') {
        openMsg += ' with browser ' + config.browser;
      }
      logutil(chalk.white(openMsg + ']'));
      urlToOpen = config.open;
      open(urlToOpen, browser);
      return;
    }
    // When it gets here the open becomes the target file instead
    urlToOpen = 'http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port;
    const browser = (typeof config.browser === 'string' ? config.browser : '');
    openMsg += urlToOpen + (browser === '' ? '' : ' with browser ' + config.browser);
    logutil(chalk.white(openMsg + ']'));
    // The actual open call
    open(urlToOpen + (typeof config.open === 'string' ? config.open : ''), browser);
    return urlToOpen;
  };
};
/**
 * Set headers
 * @param {object} config
 * @param {string} urlToOpen
 */
exports.setHeaders = (config, urlToOpen) => {
  return res => {
    if (isString(config.headers.origin) || (urlToOpen && urlToOpen.indexOf('http') === 0)) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        isString(config.headers.origin) || (isString(urlToOpen) || '*')
      );
    }
    res.setHeader(
      'Access-Control-Request-Method',
      isString(config.headers.requestMethod) || '*'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      isString(config.headers.allowMethods) || 'GET , POST , PUT , DELETE , OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      isString(config.headers.allowHeaders) || 'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
  };
};

// -- EOF --
