/* eslint complexity: "off" */
'use strict';
/**
* The new main file (use to be the index.js )
*/
const through = require('through2');
const http = require('http');
const https = require('https');
const connect = require('connect');
const serveStatic = require('serve-static');
const connectLivereload = require('connect-livereload');
const httpProxy = require('http-proxy-middleware'); // @2017-07-12 changed
const tinyLr = require('tiny-lr');
const watch = require('watch');
const fs = require('fs');
const serveIndex = require('serve-index');
const path = require('path');
const isarray = Array.isArray;
const join = require('path').join;
const chalk = require('chalk');
// Gulp-webserver script
const enableMiddlewareShorthand = require('./enableMiddlewareShorthand/index.js');
// IoDebugger scripts
const ioDebuggerInjection = require('./io-debugger/injection.js');
const ioDebuggerServer = require('./io-debugger/server.js');
const ioDebuggerClient = require('./io-debugger/middleware.js');
// Useful tools
const logutil = require('./lib/log.js');
const helper = require('./lib/helper.js');
// Version for display
const version = require('../package.json').version;
/**
 * Main
 * @param {object} options
 */
module.exports = function (options) {
  let defaults = {
    /**
        * Basic options
        */
    host: 'localhost',
    port: 8000,
    path: '/',
    fallback: false,
    https: false,
    open: false,
    /**
        * MIDDLEWARE DEFAULTS
        * NOTE:
        *  All middleware should defaults should have the 'enable'
        *  property if you want to support shorthand syntax like:
        *    webserver({
        *      livereload: true
        *    });
        */
    // Middleware: Livereload
    livereload: {
      enable: false,
      port: helper.getRandomInt(35000, 40000), // Should create a random number each time
      filter: function (filename) {
        if (filename.match(/node_modules/)) {
          return false;
        }
        return true;
      }
    },
    // Middleware: Directory listing
    // For possible options, see:
    //  https://github.com/expressjs/serve-index
    directoryListing: {
      enable: false,
      path: './',
      options: undefined
    },
    headers: {
      // For overwrite
    },
    // Middleware: Proxy
    // For possible options, see:
    // https://github.com/chimurai/http-proxy-middleware
    // replace with the `http-proxy-middleware`
    proxies: [],
    // Create our socket.io debugger
    // using the socket.io instead of just normal post allow us to do this cross domain
    ioDebugger: {
      enable: true, // Turn on by default otherwise they wouldn't be using this version anyway
      namespace: '/iodebugger',
      js: 'iodebugger-client.js',
      eventName: 'gulpWebserverIoError',
      client: true, // Allow passing a configuration to overwrite the client
      server: true, // Allow passing configuration - see middleware.js for more detail
      log: false // See wiki for more info
    }
  };
    // Deep extend user provided options over the all of the defaults
    // Allow shorthand syntax, using the enable property as a flag
  let config = enableMiddlewareShorthand(defaults, options, [
    'directoryListing',
    'livereload',
    'ioDebugger'
  ]);
  // Inject this so I can see what version is running
  config.version = version;
  // Make sure the namespace is correct first
  if (config.ioDebugger.enable) {
    var namespace = config.ioDebugger.namespace;
    if (!namespace) {
      config.ioDebugger.namespace = '/iodebugger';
    } else if (namespace.substr(0, 1) !== '/') {
      config.ioDebugger.namespace = '/' + namespace;
    }
  }
  // Config open
  if (typeof config.open === 'string' && config.open.length > 0 && config.open.indexOf('http') !== 0) {
    // Ensure leading slash if this is NOT a complete url form
    config.open = [(config.open.substr(0, 1) === '/' ? '' : '/'), config.open].join('');
  }
  // Create the webserver
  const app = connect();
  // Make this global accessible
  let urlToOpen = '';
  let lrServer = null;

  if (config.livereload.enable) {
    // Here already inject the live reload stuff so we need to figure out a different way to rewrite it
    if (config.ioDebugger.enable && config.ioDebugger.client !== false) {
      app.use(
        ioDebuggerInjection(config, {
          port: config.livereload.port
        })
      );
    } else {
      app.use(connectLivereload({
        port: config.livereload.port
      }));
    }
    if (config.https) {
      if (config.https.pfx) {
        lrServer = tinyLr({
          pfx: fs.readFileSync(config.https.pfx),
          passphrase: config.https.passphrase
        });
      } else {
        lrServer = tinyLr({
          key: fs.readFileSync(config.https.key || join(__dirname, '..', 'ssl', 'dev-key.pem')),
          cert: fs.readFileSync(config.https.cert || join(__dirname, '..', 'ssl', 'dev-cert.pem'))
        });
      }
    } else {
      lrServer = tinyLr();
    }
    lrServer.listen(config.livereload.port, config.host);
  }
  // If the ioDebugger is enable then we need to inject our own middleware here to generate the client file
  if (config.ioDebugger.enable && config.ioDebugger.client !== false) {
    // A middleware to create the client, pushing them in connect app middleware
    app.use(
      ioDebuggerClient(config)
    );
  }
  // Extra middlewares pass directly from config
  if (typeof config.middleware === 'function') {
    app.use(config.middleware);
  } else if (isarray(config.middleware)) {
    config.middleware.filter(
      m => typeof m === 'function'
    ).forEach(
      m => app.use(m)
    );
  }
  // Proxy requests @TODO need testing
  config.proxies.forEach(proxyoptions => {
    if (!proxyoptions.target) {
      logutil(chalk.red('MISSING target property for proxy setting!'));
      return; // ignore!
    }
    let source = proxyoptions.source;
    delete proxyoptions.source;
    app.use(
      source,
      httpProxy(proxyoptions)
    );
  });
  // Directory listing
  if (config.directoryListing.enable) {
    app.use(
      config.path,
      serveIndex(
        path.resolve(config.directoryListing.path),
        config.directoryListing.options
      )
    );
  }
  // Store the files for ?
  let files = [];
  // Create static server
  const stream = through.obj((file, enc, callback) => {
    app.use(
      config.path,
      serveStatic(file.path, {
        setHeaders: helper.setHeaders(config, urlToOpen)
      })
    );
    if (config.livereload.enable) {
      let watchOptions = {
        ignoreDotFiles: true,
        filter: config.livereload.filter
      };
      watch.watchTree(file.path, watchOptions, filename => {
        lrServer.changed({
          body: {
            files: filename
          }
        });
      });
    }
    files.push(file);
    callback();
  }).on('data', f => {
    files.push(f);
  }).on('end', () => {
    if (config.fallback) {
      files.forEach(file => {
        const fallbackFile = file.path + '/' + config.fallback;
        if (fs.existsSync(fallbackFile)) {
          app.use((req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            fs.createReadStream(fallbackFile).pipe(res);
          });
        }
      });
    }
  });
  // Start another part
  let webserver = null;
  if (config.https) {
    let opts;
    if (config.https.pfx) {
      opts = {
        pfx: fs.readFileSync(config.https.pfx),
        passphrase: config.https.passphrase
      };
    } else {
      opts = {
        key: fs.readFileSync(config.https.key || join(__dirname, '..', 'ssl', 'dev-key.pem')),
        cert: fs.readFileSync(config.https.cert || join(__dirname, '..', 'ssl', 'dev-cert.pem'))
      };
    }
    webserver = https.createServer(opts, app).listen(config.port, config.host, helper.openInBrowser(config));
  } else {
    webserver = http.createServer(app).listen(config.port, config.host, helper.openInBrowser(config));
  }
  // Init our socket.io server
  let socket = null;
  if (config.ioDebugger.enable && config.ioDebugger.server !== false) {
    let logger = null;
    if (config.ioDebugger.log !== false) {
      // If they pass a function (their own custom stuff)
      if (typeof config.ioDebugger.log === 'function') {
        logger = config.ioDebugger.log;
      } else {
        // Our own
        logger = require('./io-debugger/logger.js');
      }
    }
    // Passing the raw io object back
    socket = ioDebuggerServer(config, webserver, logger);
  }

  logutil('Webserver started at', chalk.cyan('http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port));

  stream.on('kill', () => {
    // Console.log('kill issued');
    webserver.close();
    if (config.livereload.enable) {
      // Console.log('livereload close called');
      lrServer.close();
    }
    if (config.ioDebugger.enable) {
      // Console.log('iodebugger socket close called');
      socket.server.close();
    }
  });
  return stream;
};
// -- EOF --
