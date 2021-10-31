var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var gulpSequence = require('gulp-sequence');


var browserSync = require('browser-sync').create();
var mainBowerFiles = require('main-bower-files');
var sass = require('gulp-sass')(require('sass'));
var autoprefixer = require('autoprefixer');
const minimist = require('minimist');

var envOptions = {
  string: 'env',
  default: { env: 'devlop' }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

gulp.task('clean', function () {
  return gulp.src(['./.tmp', './public'], { read: false })
    .pipe($.clean());
});

gulp.task('jade', function () {
  gulp.src('./source/**/*.jade')
    .pipe($.plumber()) // 當它出錯會一直做下去
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream())
});
gulp.task('copyHTML', function () {
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
});
gulp.task('sass', function () {
  return gulp.src('./source/**/*.scss')
    .pipe($.plumber()) // 當它出錯會一直做下去
    .pipe($.sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    // 編譯完成css
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(options.env === 'production', $.cleanCss()))// 加入條件式
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream()) // 加在這裡
});

gulp.task('babel', () =>
  gulp.src('./source/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.uglify({
      compress: {
        drop_console: true // 移除console.log
      }
    }))// 這邊壓縮
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function () {
  return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', ['bower'], function () {
  return gulp.src('./.tmp/vendors/**/**.js')
    .pipe($.concat('vendors.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('./public/js'))
})

gulp.task('browser-sync', function () { // 建立伺服器
  browserSync.init({
    server: {
      baseDir: "./public" // 我們主要檔案都放在public因此用這個當伺服器
    }
  });
});

gulp.task('image', () => {
  gulp.src('./source/img/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/imgs'))
});

gulp.task('watch', function () { //watch 監控
  gulp.watch('./source/**/*.scss', ['sass']);
  gulp.watch('./source/**/*.jade', ['jade']); //把jade加入監控
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*') // 要發布的路徑
    .pipe($.ghPages());
});

gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs'))// 寫入發布流程

gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'watch', 'browser-sync']); // defaul用法。 