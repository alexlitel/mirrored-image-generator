`use strict`;

var gulp = require('gulp');
var browserify = require('browserify');
var ghPages = require('gulp-gh-pages');
var jade = require('gulp-jade');
var tap = require('gulp-tap');
var buffer = require('gulp-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var es = require('event-stream');
var maps = require('gulp-sourcemaps');

gulp.task('foo', function() {
    gutil.log(gutil.env.prod === true);
});
gulp.task('browserifyMinify', function() {
    return gulp.src(['js/fabric.js', 'js/app.js'], {base: './'})
        .pipe(tap(function(file) {
            gutil.log('bundling ' + file.path);
            file.contents = browserify(file.path).bundle();

        }))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('jade', function() {
    return gulp.src('index.jade')
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('sass', function() {

    var task = gutil.env.prod ?
        gulp.src('scss/style.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/css')) : gulp.src('scss/style.scss')
        .pipe(maps.init())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(maps.write('.'))
        .pipe(gulp.dest('css'));
    if (!gutil.env.prod) {
        var min = gulp.src('scss/style.scss')
            .pipe(maps.init())
            .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(maps.write('./'))
            .pipe(gulp.dest('css'));
    }
    return gutil.env.prod ? task : es.concat(task, min);
});


gulp.task('watchFiles', function() {
  gulp.watch('js/*.js', ['browserifyMinify']);
  gulp.watch('scss/style.scss', ['sass']);
  gulp.watch('index.jade', ['jade']);
});

gulp.task('deploy', function() {
	return gulp.src(['./assets/2.jpg', './dist/**/*', './index.html'], {base: './'})
    .pipe(ghPages());
});