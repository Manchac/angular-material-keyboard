var gulp = require('gulp'),
    path = require('path'),
    jshintReporter = require('jshint-stylish'),
    plugins = require('gulp-load-plugins')({
        config: path.join(__dirname, 'package.json'),
        rename: {
            'gulp-angular-embed-templates': 'embedTemplates'
        }
    });

var sctiptPath = {
    src: {
        files: 'src/js/**/*.js'
    }
};

gulp.task('jshint', function (done) {
    gulp
        .src(sctiptPath.src.files)
        .pipe(plugins.jshint('.jshintrc'))
        .pipe(plugins.jshint.reporter(jshintReporter));
    done();
});

gulp.task('build', function () {
    var pkg = require('./package.json');
    var header = [
        '/**',
        ' * <%= pkg.name %>',
        ' * <%= pkg.description %>',
        ' * @version v<%= pkg.version %>',
        ' * @author <%= pkg.author %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' *',
        ' * NOTE: This project was originally forked from https://github.com/davidenke/angular-material-keyboard.',
        ' * Additional changes have been made since the last official release on the original repo. ',
        ' * The changelog below is from the original repo and does not reflect the changes ',
        ' * that have been made since then.',
        ' */',
        ''
    ].join('\n');

    patchPackageJSON();
    build();

    function patchPackageJSON () {
        var authors = [];
        for (var maintainerIndex in pkg.maintainers) {
            if (!pkg.maintainers.hasOwnProperty(maintainerIndex)) {
                continue;
            }

            var author = pkg.maintainers[maintainerIndex];
            authors.push(author.name + ' <' + author.email + '>')
        }
        pkg.author = authors.join('; ')
    }

    function build () {
        gulp
            .src([
                'src/js/mdKeyboard.module.js',
                'src/js/mdKeyboard.config.icons.js',
                'src/js/mdKeyboard.config.layouts.js',
                'src/js/mdKeyboard.config.deadkey.js',
                'src/js/mdKeyboard.config.numpad.js',
                'src/js/mdKeyboard.config.symbols.js',
                'src/js/mdKeyboard.decorator.js',
                'src/js/mdKeyboard.provider.js',
                'src/js/mdKeyboardUtil.service.js',
                'src/js/mdKeyboard.service.js',
                'src/js/mdKeyboard.directive.js'
            ])
            .pipe(plugins.concat('mdKeyboard.js'))
            .pipe(plugins.header(header, {pkg: pkg}))
            .pipe(plugins.embedTemplates())
            .pipe(plugins.replace(/[\r\n]+\s*\/\/.*TODO:+.*/gi, ''))
            .pipe(plugins.ngAnnotate())
            .pipe(gulp.dest('./dist/'))
            .pipe(plugins.uglify({mangle: false}))
            .pipe(plugins.concat('mdKeyboard.min.js'))
            .pipe(gulp.dest('./dist/'));

        gulp
            .src('src/css/*.scss')
            .pipe(plugins.sass().on('error', plugins.sass.logError))
            .pipe(gulp.dest('./dist/'))
            .pipe(plugins.concat('mdKeyboard.min.css'))
            .pipe(plugins.cleanCss())
            .pipe(gulp.dest('./dist/'));
    }
});

gulp.task('default', ['jshint', 'build'], function () {
    gulp.watch(sctiptPath.src.files, ['jshint', 'build']);
});

gulp.task('changelog', function (done) {
    var pkg = require('./package.json');
    var changelog = require('conventional-changelog');
    var fs = require('fs');

    var options = {
        repository: pkg.homepage,
        version: pkg.version,
        file: 'CHANGELOG.md'
    };

    var filePath = './' + options.file;
    changelog(options, function (err, log) {
        if (err) {
            throw err;
        }

        fs.writeFile(filePath, log, done);
    });
});
