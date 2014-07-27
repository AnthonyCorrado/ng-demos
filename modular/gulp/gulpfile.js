/*
 * Create references
 */
var gulp = require('gulp');
var glob = require('glob');
var pkg = require('./package.json');
var common = require('./common.js');

/*
 * Auto load all gulp plugins
 */
var gulpLoadPlugins = require("gulp-load-plugins");
var plug = gulpLoadPlugins();

/*
 * Load common utilities for gulp
 */
var gutil = plug.loadUtils(['colors', 'env', 'log', 'date']);

/*
 * Create comments for minified files
 */
var commentHeader = common.createComments(gutil);

/*
 * Could use a staging/development switch.
 * Run `gulp --staging`
 */
var type = gutil.env.staging ? 'staging' : 'development';
gutil.log('Building for', gutil.colors.magenta(type));
gutil.beep();

/*
 * Lint the code
 */
gulp.task('jshint', function () {
    return gulp.src(pkg.paths.js)
        .pipe(plug.jshint('.jshintrc'))
//        .pipe(plug.jshint.reporter('default'));
        .pipe(plug.jshint.reporter('jshint-stylish'));
});

/*
 * Minify and bundle the JavaScript
 */
gulp.task('js', ['jshint'], function () {
    return gulp.src(pkg.paths.js)
        .pipe(plug.size({showFiles: true}))
        .pipe(plug.sourcemaps.init())

        // Annotate before uglify so the code get's min'd properly.
        .pipe(plug.ngAnnotate({
            // true helps add where @ngInject is not used. It infers.
            // Doesn't work with resolve, must be explicit there
            add: true
        }))
        .pipe(plug.uglify({
//            sourceMap: true,
//            banner: '/*! <%= pkg.name %> <%= gutil.date("mmm d, yyyy h:MM:ss TT Z") %> */\n',
            mangle: true
        }))
        .pipe(plug.concat('all.min.js', {newLine: ';'}))
        .pipe(plug.sourcemaps.write('./'))
        .pipe(plug.header(commentHeader))
        .pipe(gulp.dest(pkg.paths.dev))
        .pipe(plug.size({showFiles: true}));
});


/*
 * Minify and bundle the CSS
 */
gulp.task('css', function () {
    return gulp.src(pkg.paths.css)
        .pipe(plug.size({showFiles: true}))
        .pipe(plug.minifyCss({}))
        .pipe(plug.concat('all.min.css'))
        .pipe(plug.header(commentHeader))
        .pipe(gulp.dest(pkg.paths.dev))
        .pipe(plug.size({showFiles: true}));
});

/*
 * Compress images
 */
gulp.task('images', function () {
    return gulp.src(pkg.paths.images)
        .pipe(plug.cache(plug.imagemin({optimizationLevel: 3})))
        .pipe(gulp.dest(pkg.paths.dev));
});


/*
 * Bundle the JS, CSS, and compress images.
 * Then copy files to production and show a toast.
 */
gulp.task('default', ['js', 'css', 'images'], function () {
    // Prepare files for dev
    return gulp.src(pkg.paths.dev)
        .pipe(plug.notify({
            onLast: true,
            message: "linted, bundled, and images compressed!"
        }));
});

gulp.task('stage', ['default'], function () {
    // Copy the files to staging
    return gulp.src(pkg.paths.dev)
        .pipe(gulp.dest(pkg.paths.stage))
        // Notify we are done
        .pipe(plug.notify({
            onLast: true,
            message: "staged!"
        }));
});

/*
 * Remove all files from the output folder
 */
gulp.task('cleanOutput', function () {
    return gulp.src([
        pkg.paths.dev,
        pkg.paths.stage
    ])
        .pipe(plug.clean({force: true}));
});

/*
 * Watch js files
 */
gulp.task('watchjs', function () {
    var js = [].concat(pkg.paths.js);
    var jsWatcher = gulp.watch(js, ['js']);

    jsWatcher.on('change', function (event) {
        console.log('*** File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});