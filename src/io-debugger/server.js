'use strict';
/**
 * The socket.io part
 */
const util = require('util');
const chalk = require('chalk');
const socketIO = require('socket.io');
const logutil = require('../lib/log.js');
/**
 * Just getting some color configuration
 */
const getColor = function (data) {
  let dc = 'cyan';
  let str = data.color ? data.color : (data.from ? data.from : dc);
  if (str === dc) {
    return str; // Default
  }
  switch (str) {
    case 'debug':
      return 'red';
    case 'info':
      return 'magenta';
    case 'warning':
      return 'yellow';
    default:
      if (chalk[str]) {
        return str;
      }
      return dc;
  }
};
/**
 * IoDebuggerServer
 * @param {object} config
 * @param {object} server http/https server instance
 * @param {function} logger
 */
module.exports = function (config, server, logger) {
  let socketConfig = null;
  if (typeof config.ioDebugger.server === 'object') {
    if (config.ioDebugger.server.socketOnly) {
      socketConfig = (config.ioDebugger.server.transportConfig && Array.isArray(config.ioDebugger.server.transportConfig)) ?
        config.ioDebugger.server.transportConfig :
        ['websocket'];
    }
  }
  const io = socketIO(server, socketConfig);
  const keys = ['browser', 'location'];
  // Force the socket.io server to use websocket protocol only
  /*
        There is a problem with this setting that cause the whole thing stop working!
    */
  // show if this is running
  logutil(chalk.white('[ioDebugger] ') + chalk.yellow('server is running') + ' ' + chalk.white(config.version));
  if (config.ioDebugger.debugSocket) {
    logutil(chalk.white('[ioDebugger] socket server:'), server, socketConfig);
  }
  // Run
  const namespace = io.of(config.ioDebugger.namespace);
  // Start
  namespace.on('connection', function (socket) {
    // Announce to the client that is working
    socket.emit('hello', 'IO DEBUGGER is listening ...');
    // Listen
    socket.on(config.ioDebugger.eventName, function (data) {
      // Provide a logger
      if (logger && typeof logger === 'function') {
        logger(data);
        if (config.ioDebugger.log !== 'BOTH') {
          return;
        }
      }
      // Console log output
      const time = new Date().toString();
      // Output to console
      logutil(
        chalk.yellow('io debugger msg @ ' + time)
      );
      if (typeof data === 'string') {
        logutil(
          chalk.yellow(data)
        );
      } else if (data.toString() === '[object Object]') { // This is required so we just do a simple test here
        // logutil('check typeof ' + data.toString());
        var color = getColor(data);
        if (data.from && data.color) {
          logutil('from: ', data.from);
        }
        keys.forEach(function (key) {
          if (data[key]) {
            logutil(
              chalk.yellow(key + ':') + chalk.cyan(data[key])
            );
          }
        });
        if (typeof data.msg === 'string') {
          logutil(
            chalk.yellow('message:') + chalk[color](data.msg)
          );
        } else { // This is to accomdate the integration with other logging system sending back different messages
          logutil(
            chalk.yellow('message:')
          );
          logutil(
            chalk[color](
              util.inspect(data.msg, false, 2)
            )
          );
        }
      } else { // Unknown
        // dump the content out
        logutil(
          chalk.cyan('UNKNOWN ERROR TYPE')
        );
        logutil(
          chalk.red(
            util.inspect(data, false, 2)
          )
        );
      }
    });
  }); // End configurable name space

  // finally we return the io object just the name space
  return namespace;
};

// EOF
