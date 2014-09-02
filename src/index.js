var through = require('through2');
var gutil = require('gulp-util');
var http = require('http');
var https = require('https');
var connect = require('connect');
var serveStatic = require('serve-static');
var connectLivereload = require('connect-livereload');
var proxy = require('proxy-middleware');
var tinyLr = require('tiny-lr');
var watch = require('node-watch');
var fs = require('fs');
var serveIndex = require('serve-index');
var path = require('path');
var open = require('open');
var url = require('url');
var enableMiddlewareShorthand = require('./enableMiddlewareShorthand');

module.exports = function(options) {

  var defaults = {

    /**
     *
     * BASIC DEFAULTS
     *
     **/

    host: 'localhost',
    port: 8000,
    fallback: false,
    https: false,
    open: false,

    /**
     *
     * MIDDLEWARE DEFAULTS
     *
     * NOTE:
     *  All middleware should defaults should have the 'enable'
     *  property if you want to support shorthand syntax like:
     *
     *    webserver({
     *      livereload: true
     *    });
     *
     */

    // Middleware: Livereload
    livereload: {
      enable: false,
      port: 35729
    },

    // Middleware: Directory listing
    // For possible options, see:
    //  https://github.com/expressjs/serve-index
    directoryListing: {
      enable: false,
      path: './',
      options: undefined
    },

    // Middleware: Proxy
    // For possible options, see:
    //  https://github.com/andrewrk/connect-proxy
    proxies: []

  };

  // Deep extend user provided options over the all of the defaults
  // Allow shorthand syntax, using the enable property as a flag
  var config = enableMiddlewareShorthand(defaults, options, [
    'directoryListing',
    'livereload'
  ]);

  if (typeof config.open === 'string' && config.open.length > 0) {
    // ensure leading slash
    config.open = (config.open.indexOf('/') !== 0 ? '/' : '') + config.open;
  }

  var app = connect();

  var openInBrowser = function() {
    if (config.open === false) return;
    open('http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port + (typeof config.open === 'string' ? config.open : ''));
  };

  var lrServer;

  if (config.livereload.enable) {

    app.use(connectLivereload({
      port: config.livereload.port
    }));

    if (config.https) {
      lrServer = tinyLr({
        key: fs.readFileSync(config.https.key || __dirname + '/../ssl/dev-key.pem'),
        cert: fs.readFileSync(config.https.cert || __dirname + '/../ssl/dev-cert.pem')
      });
    } else {
      lrServer = tinyLr();
    }

    lrServer.listen(config.livereload.port);

  }

  if (config.directoryListing.enable) {
    app.use(serveIndex(path.resolve(config.directoryListing.path), config.directoryListing.options));
  }

  // Proxy requests
  for (var i = 0, len = config.proxies.length; i < len; i++) {
    app.use(config.proxies[i].source, proxy(url.parse(config.proxies[i].target)));
  }


  // Create server
  var stream = through.obj(function(file, enc, callback) {

    app.use(serveStatic(file.path));

    if (config.fallback) {

      var fallbackFile = file.path + '/' + config.fallback;

      if (fs.existsSync(fallbackFile)) {

        app.use(function(req, res) {
          fs.createReadStream(fallbackFile).pipe(res);
        });

      }
    }

    if (config.livereload.enable) {

      watch(file.path, function(filename) {

        lrServer.changed({
          body: {
            files: filename
          }
        });

      });

    }

    this.push(file);

    callback();

  });

  var webserver;

  if (config.https) {
    var opts = {
      key: fs.readFileSync(config.https.key || __dirname + '/../ssl/dev-key.pem'),
      cert: fs.readFileSync(config.https.cert || __dirname + '/../ssl/dev-cert.pem')
    };
    webserver = https.createServer(opts, app).listen(config.port, config.host, openInBrowser);
  } else {
    webserver = http.createServer(app).listen(config.port, config.host, openInBrowser);
  }

  gutil.log('Webserver started at', gutil.colors.cyan('http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port));

  stream.on('kill', function() {

    webserver.close();

    if (config.livereload.enable) {
      lrServer.close();
    }

  });

  return stream;

};
