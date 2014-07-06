gulp-webserver [![Build Status](http://img.shields.io/travis/schickling/gulp-webserver.svg?style=flat)](https://travis-ci.org/schickling/gulp-webserver) [![](http://img.shields.io/npm/dm/gulp-webserver.svg?style=flat)](https://www.npmjs.org/package/gulp-webserver) [![](http://img.shields.io/npm/v/gulp-webserver.svg?style=flat)](https://www.npmjs.org/package/gulp-webserver)
==============

> Streaming gulp plugin to run a local webserver with LiveReload

##### Hint: This is a rewrite of [gulp-connect](https://github.com/AveVlad/gulp-connect/)

## Install

```sh
$ npm install --save-dev gulp-webserver
```

## Usage

The `gulp.src('root')` parameter is the root directory of the webserver. Multiple directories are possible.

```js
var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      livereload: true
    }));
});
```

## Options

Key | Type | Default | Description | 
--- | --- | --- | --- |
`host` | String | `localhost` | hostname of the webserver
`port` | Number | `8000` | port of the webserver
`livereload` | Boolean/Number | `false` | whether to use livereload (custom port also possible as value, default is `35729`)
`fallback` | String | `undefined` | file to fall back to (relative to webserver root)
`https` | Boolean | `false` | *feature coming soon*
`middleware` | Array | `[]` | *feature coming soon*

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

## License

[MIT License](http://opensource.org/licenses/MIT)













 