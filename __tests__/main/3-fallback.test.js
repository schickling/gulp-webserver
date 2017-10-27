'use strict';
const chalk = require('chalk');
const request = require('supertest');
const gutil = require('gulp-util');
const File = gutil.File;
const log = gutil.log;
const join = require('path').join;
const webserver = require('../../src/main.js');
const {baseUrl,defaultPort,defaultUrl,defaultSSLUrl} = require('../fixtures/config.js');
// Some configuration to enable https testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const rootDir = new File({ path: join(__dirname, '..', 'fixtures') });
const directoryIndexMissingDir = new File({
  path: join(__dirname, '..', 'fixtures', 'directoryIndexMissing')
});
// test start
describe('gulp-webserver-io stock test', () => {
  // Setups
  let stream;
  afterEach(() => {
    stream.emit('kill');
    stream = undefined;
  });
  // (7)
  test('(7) should fallback to default.html' , () =>
  {
      stream = webserver({
        ioDebugger: false,
        fallback: 'default.html'
      });

      stream.write(rootDir);
      stream.end();

      return request(defaultUrl)
        .get('/some/random/path/')
        .expect(200, /Default/)
        .expect('Content-Type', /text\/html; charset=UTF-8/);
  });
  // (8)
  test('(8) should server multiple sources even with a fallback' , () =>
  {
      stream = webserver({
        ioDebugger: false,
        fallback: 'default.html'
      });

      stream.write(rootDir);
      stream.write(directoryIndexMissingDir);
      stream.end();

      return request(defaultUrl)
        .get('/file.html')
        .expect(200, /file/);

  });
});
