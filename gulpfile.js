'use strict';

// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------
var gulp        = require('gulp');
var sass        = require('gulp-sass');
var sourcemaps  = require('gulp-sourcemaps');
var rigger      = require('gulp-rigger');
var connect     = require('gulp-connect');
var livereload  = require('gulp-livereload');
var open        = require('gulp-open');
var imagemin    = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var autoprefixer = require('gulp-autoprefixer');

// -----------------------------------------------------------------------------
// BUILDING
// -----------------------------------------------------------------------------

    var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'production/',
        js: 'production/js/',
    },
    src: { //Пути откуда брать исходники
        html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html  
        js: 'src/js/main.js',

    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
    },
    clean: './production'
};

gulp.task('html:build', function () {
    gulp.src(path.src.html) //Выберем файлы по нужному пути
        .pipe(rigger()) //Прогоним через rigger
        .pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
       // .pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});

gulp.task('build', [
    'html:build',  
]);


gulp.task('js:build', function () {
    gulp.src(path.src.js) //Найдем наш main файл
        .pipe(rigger()) //Прогоним через rigger
        .pipe(sourcemaps.init()) //Инициализируем sourcemap
       // .pipe(uglify()) //Сожмем наш js
        .pipe(sourcemaps.write()) //Пропишем карты
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
      //  .pipe(reload({stream: true})); //И перезагрузим сервер
});


// -----------------------------------------------------------------------------
// Configuration / settings 
// -----------------------------------------------------------------------------
var input = 'src/scss/**/*.scss';
var output = 'production/css';
var input_html = './production/*.html';

var options = {
    sass: {
        outputStyle: 'extended'
    }
};

// -----------------------------------------------------------------------------
// Server connect
// -----------------------------------------------------------------------------
gulp.task('connect', function() {
    connect.server({
        root: './production/',
        port: 8888,
        //https: true,
        //livereload: true
    });
    
});

// -----------------------------------------------------------------------------
// Sass compilation
// -----------------------------------------------------------------------------
gulp.task('sass', function () {
    return gulp.src(input)
         
        .pipe(sourcemaps.init())
        .pipe(sass(options.sass).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
       
        .pipe(gulp.dest(output)); 
});

gulp.task('html', function () {
    return gulp.src(input) 
        .pipe(livereload());
});

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------

gulp.task('fonts', function() {
  return gulp.src('node_modules/components-font-awesome/fonts/*')
    .pipe(gulp.dest('production/fonts'))
})

// -----------------------------------------------------------------------------
// IMG Compressing
// -----------------------------------------------------------------------------

gulp.task('image', function () {
    return gulp.src('src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('production/img'))
});

// -----------------------------------------------------------------------------
// Sprites
// -----------------------------------------------------------------------------

gulp.task('sprite', function() {
    var spriteData =
        gulp.src('./src/img/sprite/*.*') // source path of the sprite images
            .pipe(spritesmith({
                imgName: '../img/sprite.png',
                cssName: '_sprites.scss',
                cssFormat: 'scss',
                padding: 0,
                algorithm: 'top-down',

            }));

    spriteData.img.pipe(gulp.dest('./src/img/')); // output path for the sprite
    spriteData.css.pipe(gulp.dest('./src/scss/')); // output path for the CSS
});

// -----------------------------------------------------------------------------
// Watchers
// -----------------------------------------------------------------------------

gulp.task('watch', function() {

    gulp.watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    gulp.watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });

    livereload.listen();
    gulp.watch(input, ['sass']).on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
    gulp.watch('src/img/*', function(event) {
    gulp.run('image');
    }); 
    gulp.watch('src/img/sprite/*', function(event) {
    gulp.run('sprite');
    });
    gulp.watch(input_html, ['sass']);
    // sets up a livereload that watches for any changes in the root
    //gulp.watch(input_html).on('change', function(event) {
    //    livereload();
    //});
    gulp.src('')
    .pipe(open({app: 'chrome', uri: 'http://localhost:8888'}));
});

gulp.task('default', ['html:build', 'js:build', 'image', 'sprite', 'fonts', 'connect', 'sass', 'watch']);


