var through = require('through2');
var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var livereload = require('connect-livereload');

module.exports = function(options) {

  options = options || {};

  var host = options.host || 'localhost';
  var port = options.port || 8000;
  var livereloadPort = options.livereload || false;

  if (livereloadPort === true) {
    livereloadPort = 35729;
  }

  var webserver = connect();

  if (options.livereload) {

    webserver.use(livereload({
      port: livereloadPort
    }));

  }

  var stream = through.obj(function(file, enc, callback) {

    webserver.use(serveStatic(file.path));

    this.push(file);

    callback();

  });

  var server = http.createServer(webserver).listen(port, host);

  stream.on('kill', function() {
    server.close();
  });

  return stream;

};
