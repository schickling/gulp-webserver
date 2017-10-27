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

// test start
describe('gulp-webserver-io stock test', () => {
  // Setups
  let stream;
  afterEach(() => {
    stream.emit('kill');
    stream = undefined;
  });
  // (5)
  test('(5) should work with https' , () =>
  {
      stream = webserver({
        https: true,
        ioDebugger: false
      });

      stream.write(rootDir);

      return request(defaultSSLUrl)
        .get('/')
        .expect(200, /Hello World/);
  });
  // (6)
  test('(6) should work with https and custom certificate' , () =>
  {
      stream = webserver({
        ioDebugger: false,
        https: {
          key: join(__dirname , '..','ssl','dev-key.pem'),
          cert: join(__dirname , '..' , 'ssl' , 'dev-cert.pem')
        }
      });

      stream.write(rootDir);

      return request(defaultSSLUrl)
        .get('/')
        .expect(200, /Hello World/)
  });

});
