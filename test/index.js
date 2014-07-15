var request = require('supertest');
var File = require('vinyl');
var webserver = require('../src');

describe('gulp-webserver', function () {

  var stream;
  var rootDir = new File({
    path: __dirname + '/fixtures'
  });

  afterEach(function () {
    stream.emit('close');
  });

  it('should work with default options', function (done) {
    stream = webserver({
      open: false
    });

    stream.write(rootDir, function () {
      request('http://localhost:3000')
      .get('/')
      .expect(200, /Hello World/)
      .end(function (err) {
        if (err) return done(err);
        done();
      });
    });
  });

  it('should work with custom port', function (done) {
    stream = webserver({
      open: false,
      port: 9000
    });

    stream.write(rootDir, function () {
      request('http://localhost:9000')
      .get('/')
      .expect(200, /Hello World/)
      .end(function (err) {
        if (err) return done(err);
        done();
      });
    });
  });

  it('should work with custom host', function (done) {
    stream = webserver({
      open: false,
      host: '127.0.0.1'
    });

    stream.write(rootDir, function () {
      request('http://127.0.0.1:3000')
      .get('/')
      .expect(200, /Hello World/)
      .end(function (err) {
        if (err) return done(err);
        done();
      });
    });
  });

  // it('should fall back to default.html', function (done) {
  //   stream = webserver({
  //     fallback: 'default.html'
  //   });

  //   stream.write(rootDir);

  //   request('http://127.0.0.1:8000')
  //     .get('/some/random/path/')
  //     .expect(200, /Default/)
  //     .end(function (err) {
  //       if (err) return done(err);
  //       done(err);
  //     });
  // });
});
