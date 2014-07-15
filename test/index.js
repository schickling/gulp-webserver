var request = require('supertest');
var webserver = require('../src');
var File = require('gulp-util').File;

describe('gulp-webserver', function() {

  var stream;

  var rootDir = new File({
    path: __dirname + '/fixtures'
  });

  var directoryIndexMissingDir = new File({
    path: __dirname + '/fixtures/directoryIndexMissing'
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

  it('should fall back to default.html', function(done) {

    stream = webserver({
      fallback: 'default.html'
    });

    stream.write(rootDir);

    request('http://localhost:8000')
      .get('/some/random/path/')
      .expect(200, /Default/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

  it('should show a directory listing when the shorthand setting is enabled', function(done) {

    stream = webserver({
      directoryListing: true
    });

    stream.write(directoryIndexMissingDir);

    request('http://localhost:8000')
      .get('/')
      .expect(200,/listing directory/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

  it('should not show a directory listing when the shorthand setting is disabled', function(done) {

    stream = webserver({
      directoryListing: false
    });

    stream.write(directoryIndexMissingDir);

    request('http://localhost:8000')
      .get('/')
      .expect(404,/Cannot GET/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });

  });

  it('should start the livereload server when the shorthand setting is enabled', function(done) {

    stream = webserver({
      livereload: true
    });

    stream.write(rootDir);

    request('http://localhost:8000')
      .get('/')
      .expect(200,/Hello World/)
      .end(function(err) {
        if (err) return done(err);
      });
    request('http://localhost:35729')
      .get('/')
      .expect(200,/tinylr/)
      .end(function(err) {
        if (err) return done(err);
        done(err);
      });
  });

  it('should not start the livereload server when the shorthand setting is disabled', function(done) {

    stream = webserver({
      livereload: false
    });

    stream.write(rootDir);

    request('http://localhost:8000')
      .get('/')
      .expect(200,/Hello World/)
      .end(function(err) {
        if (err) return done(err);
      });
    request('http://localhost:35729')
      .get('/')
      .end(function(err) {
        if(err && err.code === "ECONNREFUSED") {
          done();
        } else {
          if (err) {
            return done(err);
          } else {
            done(new Error('livereload should not be started when shorthand middleware setting is set to false'));
          }
        }
        
      });
  });

});
