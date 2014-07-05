gulp-webserver [![Build Status](http://img.shields.io/travis/schickling/gulp-webserver.svg?style=flat)](https://travis-ci.org/schickling/gulp-webserver) [![](http://img.shields.io/npm/dm/gulp-webserver.svg?style=flat)](https://www.npmjs.org/package/gulp-webserver) [![](http://img.shields.io/npm/v/gulp-webserver.svg?style=flat)](https://www.npmjs.org/package/gulp-webserver)
==============

Streaming gulp plugin to run a local webserver with LiveReload

## Install

```sh
$ npm install --save-dev gulp-webserver
```

## Usage

```js
var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      port: 8000,
      livereload: true
    }));
});
```
