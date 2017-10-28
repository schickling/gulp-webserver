# gulp-webserver-io V.2

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

*This is the final maintaince release, no further development with this repo.
We are currently working on a brand new repo. Please check [gulp-server-io](https://github.com/NewbranLTD/gulp-server-io) for more info*

This is based on the [gulp-webserver](https://github.com/schickling/gulp-webserver)

> Streaming gulp plugin to run a local webserver with LiveReload
> plus enable `console.log` message to show in the command line (console , terminal whatever) with socket.io,
> this will help you debug your web app with mobile devices.

The addition is a socket.io based debugger inspired by [this article](https://www.sitepoint.com/proper-error-handling-javascript/) from [sitepoint](https://www.sitepoint.com)

All the original `gulp-webserver` configuration is the same. To configure the new socket.io debugger:

    var gulp = require('gulp');
    var webserver = require('gulp-webserver-io');

    gulp.task('webserver' , function()
    {
        return gulp.src('app')
                   .pipe(webserver({
                       livereload: false,
                       directoryListing: false,
                       open: true,
                       ioDebugger: true // enable the ioDebugger  
                   });

    });

*NOTE this ioDebugger set to true by default since V1.0.4, because we assume you want to use this feature otherwise you wouldn't be using it, right?*    

Once you run your gulp task. Your browser will find two extra files injected 1. The `socket.io.js` 2. `io-debugger-client.js`

Also on the initial run, you will received a message from the `console.log`

    debugger init connection:  IO DEBUGGER is listening ...

Now whenever you have javascript error in your page, not only your console from your browser will see the error. Your command line console
which run the gulp will also see the message as well.

## BREAKING CHANGE

We have remove the `node-proxy-middleware-spy-io` with `http-proxy-middleware`. This will have some side effects on your current projects. Take a look at this example

```js
// V1.3 and V2.0 configuration is exactly the same  
    webserver({
        proxies: [{
            source: '/api',
            target: 'http://anotherhost'
        }]
    });
```

Now in V1.3 and previous. When you call `/api` end point. The `http://anotherhost` will serve up the data you are looking for. But with `http-proxy-middleware`. You need to go one level down

```

    [V1.3] http://localhost:8000/api --> http://anotherhost      

    [V2.0] http://localhost:8000/api --> http://anotherhost/api

```

For live example, you can look into the `__tests__/proxy.js` to see how the test was conducted.

### Configuration

```js
    ioDebugger: {
        enable: true,
        namespace: '/iodebugger', // the namespace for the socket.io REQUIRED
        js: 'io-debugger-client.js', // the client file that will get inject to your page, if you pass FALSE then you need to inject it manually
        client: {}, // see below
		server: {}, // see below
		log: false // See below
    }
```

### client

If you pass the `client:false` then you also need to include the `/socket.io/socket.io.js` as well. Because they are injected at the same time.

The reason why you want to do this may be because you want to fine-tune the console message. It will accept the following data type

    default: String
    or
    Object {
        from: String // if you don't pass color this will only use to check what color should use, debug --> red , info --> blue , warning --> yellow
        color: String // <-- color method from [colors](https://www.npmjs.com/package/colors)
        msg: String // <-- the error message,
		browser: String // the navigator.userAgent
		location: String // the window.location.href
    }

Also you might want to integrate into your log method from your application.

Note: Check this [wiki to see how to integrate with your angular (1.x) app](https://github.com/joelchu/gulp-webserver-io/wiki/Creating-an-Angular-(1.X)-%24log-that-log-message-to-the-server.).

You could fine tune how the client run as well

```js
	ioDebugger: {
		enable: true 	
		client: {
			host: 'anotherHostName',
			port: 'anotherPortNumber'
		},
		server: false // see below
	}

```

There might be situation where you just want to run your client code but point to a different server. Note that when you set it up like this, you MUST
include the `/socket.io/socket.io.js` file from somewhere else.

See [server configuration option](https://github.com/joelchu/gulp-webserver-io/wiki/Server-configuration-option) for more information.

####server

If you pass `server:false` then the server listener will not run. This has to work together with the client option above

---

## Install

```sh
$ npm install --save-dev gulp-webserver-io
```

[JOEL CHU](https://joelchu.com) 2017

---

============== ORIGINAL README =================

> Streaming gulp plugin to run a local webserver with LiveReload

##### Hint: This is a rewrite of [gulp-connect](https://github.com/AveVlad/gulp-connect/)



## Usage

The `gulp.src('root')` parameter is the root directory of the webserver. Multiple directories are possible.

```js
var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      livereload: true,
      directoryListing: true,
      open: true
    }));
});
```

## Options

Key | Type | Default | Description |
--- | --- | --- | --- |
`host` | String | `localhost` | hostname of the webserver
`port` | Number | `8000` | port of the webserver
`path` | String | `/` | path to the webserver
`livereload` | Boolean/Object | `false` | whether to use livereload. For advanced options, provide an object. You can use the 'port' property to set a custom live reload port and the `filter` function to filter out files to watch. The object also needs to set `enable` property to true (e.g. `enable: true`) in order to activate the livereload mode. It is off by default.
`directoryListing` | Boolean/Object | `false` | whether to display a directory listing. For advanced options, provide an object with the 'enable' property set to true. You can use the 'path' property to set a custom path or the 'options' property to set custom [serve-index](https://github.com/expressjs/serve-index) options.
`fallback` | String | `undefined` | file to fall back to (relative to webserver root)
`open` | Boolean/String | `false` | open the localhost server in the browser. By providing a String you can specify the path to open (for complete path, use the complete url `http://my-server:8080/public/`) .
`https` | Boolean/Object | `false` | whether to use https or not. By default, `gulp-webserver` provides you with a development certificate but you remain free to specify a path for your key and certificate by providing an object like this one: `{key: 'path/to/key.pem', cert: 'path/to/cert.pem'}`.
`middleware` | Function/Array | `[]` | a connect middleware function or a list of middleware functions
`proxies` | Array | `[]`| a list of proxy objects.  Each proxy object can be specified by `{source: '/abc', target: 'http://localhost:8080/abc', options: {headers: {'ABC_HEADER': 'abc'}}}`.

## FAQ

#### Why can't I reach the server from the network?

**Solution**: Set `0.0.0.0` as `host` option.

#### How can I use `html5Mode` for my single page app with this plugin?

**Solution**: Set the `index.html` of your application as `fallback` option. For example:

```js
gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      fallback: 'index.html'
    }));
});
```

#### How can I pass a custom filter to livereload?

**Solution**: Set `enable: true` and provide filter function in `filter:` property of the livereload object. For example:

```js
gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      livereload: {
        enable: true, // need this set to true to enable livereload
        filter: function(fileName) {
          if (fileName.match(/.map$/)) { // exclude all source maps from livereload
            return false;
          } else {
            return true;
          }
        }
      }
    }));
});
```

#### How can I kill the running server?

**Solution**: Either by pressing `Ctrl + C` or programmatically like in this example:

```js
var stream = gulp.src('app').pipe(webserver());
stream.emit('kill');
```

## License

[MIT License](http://opensource.org/licenses/MIT)

[npm-image]: https://badge.fury.io/js/gulp-webserver-io.svg
[npm-url]: https://npmjs.org/package/gulp-webserver-io
[travis-image]: https://travis-ci.org/joelchu/gulp-webserver-io.svg?branch=master
[travis-url]: https://travis-ci.org/joelchu/gulp-webserver-io
[daviddm-image]: https://david-dm.org/joelchu/gulp-webserver-io.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/joelchu/gulp-webserver-io
