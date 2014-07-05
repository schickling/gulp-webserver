var request = require('supertest');
var webserver = require('../src');
var File = require('vinyl');

describe('gulp-webserver', function() {

  var stream;

  var rootDir = new File({
    path: __dirname + '/fixtures'
  });

  afterEach(function() {
    stream.emit('kill');
  });

  it('should work with default options', function(done) {

    stream = webserver();

    stream.write(rootDir);

    request('http://localhost:8000')
      .get('/')
      .expect(200, /Hello World/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

  it('should work with custom port', function(done) {

    stream = webserver({
      port: 1111
    });

    stream.write(rootDir);

    request('http://localhost:1111')
      .get('/')
      .expect(200, /Hello World/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

  it('should work with custom host', function(done) {

    stream = webserver({
      host: '0.0.0.0'
    });

    stream.write(rootDir);

    request('http://0.0.0.0:8000')
      .get('/')
      .expect(200, /Hello World/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

});
