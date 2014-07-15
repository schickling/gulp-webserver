var browserSync = require('browser-sync');
var through = require('through2');
var chalk = require('chalk');
var watch = require('node-watch');
var fs = require('fs');
var util = require('util');

module.exports = function (options) {
  options = options || {};

  var fallback = options.fallback;

  var config = {};
  config.host = options.host || 'localhost';
  config.port = options.port || 8000;
  config.logLevel = options.logLevel || 'info';
  config.middleware = util.isArray(options.middleware) ? options.middleware : [];
  config.open = options.open === false ? false : true;

  var stream = through.obj(function (file, enc, callback) {
    config.server = {
      baseDir: file.path
    };

    browserSync(config);

    // if (fallback) {
    //   var fallbackFile = file.path + '/' + fallback;

    //   if (fs.existsSync(fallbackFile)) {
    //     // app.use(function (req, res) {
    //     //   fs.createReadStream(fallbackFile).pipe(res);
    //     // });
    //   }
    // }

    watch(file.path, function (filename) {
      browserSync.reload(filename);
    });

    this.push(file);

    callback();
  });

  // stream.on('kill', function () {
  //   browserSync.exit();
  // });

  return stream;
};
