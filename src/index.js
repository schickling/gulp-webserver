var through = require('through2');
var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var connectLivereload = require('connect-livereload');
var tinyLr = require('tiny-lr');
var watch = require('node-watch');
var fs = require('fs');

module.exports = function(options) {

  options = options || {};

  var host = options.host || 'localhost';
  var port = options.port || 8000;
  var livereloadPort = options.livereload || false;

  if (livereloadPort === true) {
    livereloadPort = 35729;
  }

  var fallback = options.fallback;

  var app = connect();
  var lrServer;

  if (livereloadPort) {

    app.use(connectLivereload({
      port: livereloadPort
    }));

    lrServer = tinyLr();
    lrServer.listen(livereloadPort);

  }

  var stream = through.obj(function(file, enc, callback) {

    app.use(serveStatic(file.path));

    if (fallback) {

      var fallbackFile = file.path + '/' + fallback;

      if (fs.existsSync(fallbackFile)) {

        app.use(function(req, res) {
          fs.createReadStream(fallbackFile).pipe(res);
        });

      }
    }

    if (livereloadPort) {

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

  var webserver = http.createServer(app).listen(port, host);

  stream.on('kill', function() {

    webserver.close();

    if (livereloadPort) {
      lrServer.close();
    }

  });

  return stream;

};
