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
const rootDir = new File({ path: join(__dirname, '..','fixtures') });
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

  // (9) this will be the last directory listing test - we skip the other disabled negative test etc
  // there were:
  // - should not show a directory listing when the shorthand setting is disabled
  // - should show a directory listing when the shorthand setting is enabled and using custom path
  // they are not being use very often
  test('(9) should show a directory listing when the shorthand settings is enabled' , () =>
  {
      stream = webserver({
        ioDebugger: false,
        directoryListing: true
      });

      stream.write(directoryIndexMissingDir);

      return request(defaultUrl)
        .get('/')
        .expect(200, /listing directory/);
  });

  // (10) this one will be different because the v2 assign a random port between 35000~40000
  // therefore we need to fix on one port number
  test('(10) should start the livereload server when the shorthand setting is enabled' , () =>
  {
      const test10port = 35729;
      stream = webserver({
        ioDebugger: false,
        livereload: {
          enable:true,
          port: test10port
        }
      });

      stream.write(rootDir);

      return request(['http://' , baseUrl, ':' , test10port].join(''))
        .get('/')
        .expect(200, /tinylr/)
  });
});
