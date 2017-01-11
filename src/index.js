var through = require('through2');
var gutil = require('gulp-util');
var http = require('http');
var https = require('https');
var connect = require('connect');
var serveStatic = require('serve-static');
var connectLivereload = require('connect-livereload');
var proxy = require('node-proxy-middleware-spy-io'); // @2016-12-12 changed
var tinyLr = require('tiny-lr');
var watch = require('watch');
var fs = require('fs');
var serveIndex = require('serve-index');
var path = require('path');
var open = require('open');
var url = require('url');
var extend = require('node.extend');
var isarray = require('isarray');
var colors = require('colors');
// gulp-webserver script
var enableMiddlewareShorthand = require('./enableMiddlewareShorthand');
// ioDebugger scripts
var ioDebuggerInjection = require('./io-debugger/injection.js');
var ioDebuggerServer = require('./io-debugger/server.js');
var ioDebuggerClient = require('./io-debugger/middleware.js');

var version = require('../package.json').version;

/**
 * main
 */
module.exports = function(options) {


  var defaults = {
    /**
     *
     * BASIC DEFAULTS
     *
     **/

    host: 'localhost',
    port: 8000,
    path: '/',
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
        port: 35729,
        filter: function (filename) {
            if (filename.match(/node_modules/)) {
                return false;
            } else {
                return true;
            }
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

    // Middleware: Proxy
    // For possible options, see:
    //  https://github.com/andrewrk/connect-proxy
    // this has not replace with a folk version https://github.com/joelchu/node-proxy-middleware-spy-io
    proxies: [],
    // create our socket.io debugger
    // using the socket.io instead of just normal post allow us to do this cross domain
    ioDebugger: {
        enable: true, // turn on by default otherwise they wouldn't be using this version anyway
        namespace: '/iodebugger',
        connectionNamespace: false, // '/iodebuggerconnection', @1.2.4 this is disabled by default 
		js: 'iodebugger-client.js',
		eventName: 'gulpWebserverIoError',
        client: true, // allow passing a configuration to overwrite the client
		server: true, // allow passing configuration - see middleware.js for more detail
        log: false // see wiki for more info
    }
  };


  // Deep extend user provided options over the all of the defaults
  // Allow shorthand syntax, using the enable property as a flag
  var config = enableMiddlewareShorthand(defaults, options, [
      'directoryListing',
      'livereload',
      'ioDebugger'
  ]);
  // inject this so I can see what version is running
  config.version = version;

  // make sure the namespace is correct first
  if (config.ioDebugger.enable) {
      var namespace = config.ioDebugger.namespace;
	  if (!namespace) {
		  config.ioDebugger.namespace =  '/iodebugger';
	  } else if (namespace.substr(0,1)!=='/') {
          config.ioDebugger.namespace = '/' + namespace;
      }
  }

  if (typeof config.open === 'string' && config.open.length > 0 && config.open.indexOf('http') !== 0) {
      // ensure leading slash if this is NOT a complete url form
      config.open = (config.open.indexOf('/') !== 0 ? '/' : '') + config.open;
  }

  var app = connect();

  var openInBrowser = function() {
  		if (config.open === false) return;
    	if (typeof config.open === 'string' && config.open.indexOf('http') === 0) {
      		// if this is a complete url form
      		open(config.open);
      		return;
    	}
    	open('http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port + (typeof config.open === 'string' ? config.open : ''));
  };

  var lrServer;

  if (config.livereload.enable) {
      // here already inject the live reload stuff so we need to figure out a different way to rewrite it
      if (config.ioDebugger.enable && config.ioDebugger.client !== false) {
          app.use(
              ioDebuggerInjection(config , {
                  port: config.livereload.port
              })
          );
      }
      else {
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
          }
          else {
              lrServer = tinyLr({
                  key: fs.readFileSync(config.https.key || __dirname + '/../ssl/dev-key.pem'),
                  cert: fs.readFileSync(config.https.cert || __dirname + '/../ssl/dev-cert.pem')
              });
          }
      }
      else {
          lrServer = tinyLr();
      }

      lrServer.listen(config.livereload.port, config.host);
  }
  // if the ioDebugger is enable then we need to inject our own middleware here to generate the client file
  if (config.ioDebugger.enable && config.ioDebugger.client !== false) {
        /**
         * a middleware to create the client, pushing them in connect app middleware
         */
        app.use(
            ioDebuggerClient(config)
        );
  }

  // middlewares
  if (typeof config.middleware === 'function') {
      app.use(config.middleware);
  } else if (isarray(config.middleware)) {
      config.middleware
            .filter(function(m) { return typeof m === 'function'; })
            .forEach(function(m) {
                app.use(m);
            });
  }

  // Proxy requests
  for (var i = 0, len = config.proxies.length; i < len; i++) {
      var proxyoptions = url.parse(config.proxies[i].target);
      if (config.proxies[i].hasOwnProperty('options')) {
          extend(proxyoptions, config.proxies[i].options);
      }
      app.use(config.proxies[i].source, proxy(proxyoptions));
  }

  if (config.directoryListing.enable) {
      app.use(config.path, serveIndex(path.resolve(config.directoryListing.path), config.directoryListing.options));
  }


  var files = [];

  // Create server
  var stream = through.obj(function(file, enc, callback) {

  		app.use(config.path, serveStatic(file.path));

    	if (config.livereload.enable) {
      		var watchOptions = {
        		ignoreDotFiles: true,
        		filter: config.livereload.filter
      		};
      		watch.watchTree(file.path, watchOptions, function (filename) {
        		lrServer.changed({
          			body: {
            			files: filename
          			}
        		});
      		});
    	}
    	this.push(file);
    	callback();
  })
  .on('data', function(f){files.push(f);})
  .on('end', function(){
  		if (config.fallback) {
      		files.forEach(function(file){
        		var fallbackFile = file.path + '/' + config.fallback;
        		if (fs.existsSync(fallbackFile)) {
          			app.use(function(req, res) {
            			res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            			fs.createReadStream(fallbackFile).pipe(res);
          			});
       	 		}
      		});
    	}
  });

  var webserver;

  if (config.https) {
    	var opts;

    	if (config.https.pfx) {
      		opts = {
        		pfx: fs.readFileSync(config.https.pfx),
        		passphrase: config.https.passphrase
      		};
    	} else {
      		opts = {
        		key: fs.readFileSync(config.https.key || __dirname + '/../ssl/dev-key.pem'),
        		cert: fs.readFileSync(config.https.cert || __dirname + '/../ssl/dev-cert.pem')
      		};
    	}
    	webserver = https.createServer(opts, app).listen(config.port, config.host, openInBrowser);
  } else {
    	webserver = http.createServer(app).listen(config.port, config.host, openInBrowser);
  }
  var socket;
  // init our socket.io server
  if (config.ioDebugger.enable && config.ioDebugger.server !== false) {

	  var logger;
	  if (config.ioDebugger.log !== false) {
		  // if they pass a function (their own custom stuff)
		  if (typeof config.ioDebugger.log === 'function') {
			  logger = config.ioDebugger.log;
		  }
		  else {
			  // our own
			  logger = require('./io-debugger/logger.js');
		  }
	  }
      // passing the raw io object back
      socket = ioDebuggerServer(config , webserver , logger);

      // it didn't work once we use the ioResolver to return the namespaced socket
      // what about we just export the io object directly?
      // try to pass this io object back to the script running this process
      /*
      if (config.ioDebugger.ioResolver && typeof config.ioDebugger.ioResolver === 'function') {
          // 2016-12-20 try to do this here and see what happen
          config.ioDebugger.ioResolver(socket);
      }
      */
  }

  gutil.log('Webserver started at', gutil.colors.cyan('http' + (config.https ? 's' : '') + '://' + config.host + ':' + config.port));

  stream.on('kill', function() {

    	webserver.close();

    	if (config.livereload.enable) {
      		lrServer.close();
    	}
        if (config.ioDebugger.enable) {
            socket.server.close();
        }
  });

  return stream;

};
