var through = require('through2');
var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var connectLivereload = require('connect-livereload');
var tinyLr = require('tiny-lr');
var watch = require('node-watch');

module.exports = function(options) {

  options = options || {};

  var host = options.host || 'localhost';
  var port = options.port || 8000;
  var livereloadPort = options.livereload || false;

  if (livereloadPort === true) {
    livereloadPort = 35729;
  }

  var webserver = connect();
  var lrServer;

  if (livereloadPort) {

    webserver.use(connectLivereload({
      port: livereloadPort
    }));

    lrServer = tinyLr();
    lrServer.listen(livereloadPort);

  }

  var stream = through.obj(function(file, enc, callback) {

    webserver.use(serveStatic(file.path));

    this.push(file);

    if (livereloadPort) {

      watch(file.path, function(filename) {

        lrServer.changed({
          body: {
            files: filename
          }
        });

      });

    }

    callback();

  });

  var server = http.createServer(webserver).listen(port, host);

  stream.on('kill', function() {
    server.close();
  });

  return stream;

};
