'use strict';
/**
 * Middleware to serve up the client file
 */
const fs = require('fs');
const chalk = require('chalk');
const join = require('path').join;
// Const gutil = require('gulp-util');
const logutil = require('../lib/log.js');

module.exports = function (config) {
  const opts = config.ioDebugger;

  // Now we need to supply a configurated option to not just point to our own local test machine
  // const debuggerHost = opts.server.host || config.host;
  // const debuggerPort = opts.server.port || config.port;
  const debuggerPath = opts.namespace;
  const debuggerJs = [debuggerPath, opts.js].join('/');
  const debuggerEventName = opts.eventName;

  logutil(chalk.white('[ioDebugger] ') + chalk.yellow('client is running'));

  return function (req, res, next) {
    if (req.url === debuggerJs) {
      fs.readFile(join(__dirname, 'client.tpl'), function (err, data) {
        if (err) {
          res.writeHead(500);
          logutil(
            chalk.red('Error reading io-debugger-client file'),
            chalk.yellow(err)
          );
          return res.end('Just died!');
        }
        // If they want to ping the server back on init
        const ping = (typeof opts.client === 'object' && opts.client.ping) ? 'true' : 'false';
        // There is a problem when the server is running from localhost
        // and serving out to the proxy and the two ip address are not related to each other
        // and for most of the cases, the client is always pointing back to itself anyway
        // [OLD] .replace('{host}' , debuggerHost).replace('{port}' , debuggerPort)
        // var serverHostPath = 'http://{debuggerHost}:{debuggerPort}';
        // search and replace
        let serveData = data.toString().replace(
          '{debuggerPath}', debuggerPath
        ).replace(
          '{eventName}', debuggerEventName
        ).replace(
          '{ping}', ping
        );
        // Force websocket connection
        // see: http://stackoverflow.com/questions/8970880/cross-domain-connection-in-socket-io
        // @2017-06-29 forcing the connection to socket only because it just serving up local!
        let connectionOptions = ', {\'force new connection\': false , \'transports\': [\'websocket\']}';

        if (typeof config.ioDebugger.server === 'object') {
          if (config.ioDebugger.server.clientConnectionOptions && typeof config.ioDebugger.server.clientConnectionOptions === 'object') {
            connectionOptions = ', ' + JSON.stringify(config.ioDebugger.server.clientConnectionOptions);
          }
        }
        serveData = serveData.replace('{connectionOptions}', connectionOptions);
        // @TODO we should cache this file, otherwise every reload will have to generate it again
        res.writeHead(200);
        res.end(serveData);
      });
    } else {
      next();
    }
  };
};
