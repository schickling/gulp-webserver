'use strict';
const request = require('supertest');
const webserver = require('../src/main.js');
const gutil = require('gulp-util');
const File = gutil.File;
const log = gutil.log;
const join = require('path').join;
const chalk = require('chalk');
// parameters
const {baseUrl,defaultPort,defaultUrl,defaultSSLUrl} = require('./fixtures/config.js');

// Some configuration to enable https testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Setups
let stream;


const rootDir = new File({
  path: join(__dirname, 'fixtures')
});

const directoryIndexMissingDir = new File({
  path: join(__dirname, 'fixtures', 'directoryIndexMissing')
});

afterEach(() => {
    stream.emit('kill');
    stream = undefined;
});

/*
afterAll( () =>
{
    log(chalk.yellow('everything done afterAll callback'));
});
*/
describe('gulp-webserver-io stock test', () => {

  // (1) test with basic options
  test('(1) should work with default options', () => {
    stream = webserver();
    stream.write(rootDir);
    return request(
        defaultUrl
    ).get(
      '/'
    ).expect(
      200, /Hello World/
    );
  });
  // (2) test with custom port number
  test('(2) should work with custom port', () =>
  {
      const test2port = 1111;
    stream = webserver({
        port: test2port
    });
    stream.write(rootDir);
    return request(
        ['http://', baseUrl , ':', test2port].join('')
    ).get(
        '/'
    ).expect(
        200, /Hello World/
    );
  });
  // (3)
  test('(3) should work with custom host', () =>
  {
      const test3host = '0.0.0.0';
      stream = webserver({
          host: test3host
      });
      stream.write(rootDir);

      return request(
          ['http://' , test3host , ':' , defaultPort].join('')
      ).get('/').expect(200, /Hello World/);
  });
  // (4)
  test('(4) should work with custom path' , () =>
  {
      const test4path = '/custom/path';
      stream = webserver({
        path: test4path
      });

      stream.write(rootDir);

      return request( [defaultUrl , test4path].join('') )
        .get('/')
        .expect(200, /Hello World/);
  });
  // (5)
  test('(5) should work with https' , () =>
  {
      stream = webserver({
        https: true
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
  // (7)
  test('(7) should fallback to default.html' , () =>
  {
      stream = webserver({
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
        fallback: 'default.html'
      });

      stream.write(rootDir);
      stream.write(directoryIndexMissingDir);
      stream.end();

      return request(defaultUrl)
        .get('/file.html')
        .expect(200, /file/);

  });
  // (9) this will be the last directory listing test - we skip the other disabled negative test etc
  // there were:
  // - should not show a directory listing when the shorthand setting is disabled
  // - should show a directory listing when the shorthand setting is enabled and using custom path
  // they are not being use very often
  test('(9) should show a directory listing when the shorthand settings is enabled' , () =>
  {
      stream = webserver({
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
