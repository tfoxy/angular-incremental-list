var gulp = require('gulp');
var Server = require('karma').Server;
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var header = require('gulp-header');
var footer = require('gulp-footer');
var rename = require('gulp-rename');
var es = require('event-stream');
var del = require('del');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber'); // To prevent pipe breaking caused by errors at 'watch'
var git = require('gulp-git');
var bump = require('gulp-bump');
var runSequence = require('run-sequence');
var indent = require('gulp-indent');
var versionAfterBump;

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

gulp.task('default', ['build', 'test']);
gulp.task('build', ['scripts']);
gulp.task('test', ['build', 'karma']);

gulp.task('clean', function() {
  return del(['angular-incremental-list*.js']);
});

gulp.task('watch', ['build', 'karma-watch'], function() {
  gulp.watch(['src/**/*.{js,html}'], ['build']);
});

gulp.task('scripts', ['clean'], function() {
  var buildLib = function() {
    return gulp.src(['src/*.js'])
        .pipe(plumber({
          errorHandler: handleError
        }))
        .pipe(concat('angular-incremental-list.js'))
        .pipe(indent())
        .pipe(header('(function() {\n  \'use strict\';\n\n'))
        .pipe(footer('\n}());\n'))
        .pipe(jscs())
        .pipe(jscs.reporter())
        .pipe(jscs.reporter('fail'))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
  };
  var config = {
    pkg: require('./package.json'),
    banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * @see <%= pkg.repository.url %>\n' +
    ' * @version <%= pkg.version %> - <%= timestamp %>\n' +
    ' * @author <%= pkg.author %>\n' +
    ' * @license <%= pkg.license %>\n' +
    ' */\n\n'
  };

  return es.merge(buildLib())
      .pipe(plumber({
        errorHandler: handleError
      }))
      .pipe(header(config.banner, {
        timestamp: (new Date()).toISOString(), pkg: config.pkg
      }))
      .pipe(gulp.dest('.'))
      .pipe(uglify({preserveComments: 'some'}))
      .pipe(rename({extname: '.min.js'}))
      .pipe(gulp.dest('.'));

});

gulp.task('karma', ['build'], function() {
  var server = new Server({configFile: __dirname + '/karma.conf.js', singleRun: true});
  server.start();
});

gulp.task('karma-watch', ['build'], function() {
  var server = new Server({configFile: __dirname + '/karma.conf.js', singleRun: false});
  server.start();
});

gulp.task('release:bump', function() {
  var type = process.argv[3] || 'patch';
  return gulp.src(['./package.json'])
      .pipe(bump({type: type}))
      .pipe(gulp.dest('./'))
      .on('end', function() {
        versionAfterBump = require('./package.json').version;
      });
});

gulp.task('release:rebuild', function(cb) {
  runSequence('release:bump', 'build', cb); // bump will here be executed before build
});

gulp.task('release:commit', ['release:rebuild'], function() {
  return gulp.src(['./package.json', './angular-incremental-list*.js'])
      .pipe(git.add())
      .pipe(git.commit(versionAfterBump));
});

gulp.task('release:tag', ['release:commit'], function() {
  git.tag(versionAfterBump, versionAfterBump);
});

gulp.task('release', ['release:tag']);
