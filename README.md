gulp-webserver
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
