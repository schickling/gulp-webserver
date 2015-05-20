var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul');

gulp.task('spec', function (cb) {
  gulp.src('src/**/*.js')
      .pipe(istanbul())
      .on('finish', function () {
        gulp.src('test/index.js')
            .pipe(mocha({ bail: false }))
            .on('error', function () {})
            .pipe(istanbul.writeReports())
            .on('end', cb);
      });
});

gulp.task('develop', function () {
  gulp.watch(['src/**/*.js', 'test/index.js'], ['spec']);
});

gulp.task('default', ['spec']);
