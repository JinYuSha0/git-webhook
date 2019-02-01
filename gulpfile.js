const gulp = require('gulp')
const tslint = require('gulp-tslint')
const nodemon = require('gulp-nodemon')
const ts = require('gulp-typescript')
const tsProject = ts.createProject('tsconfig.json')

/**
 * series逐个运行
 * parallel并行
 */
gulp.task('compile', () => {
  return tsProject.src()
    .pipe(tslint({
      formatter: 'prose'
    }))
    .pipe(tslint.report({
      emitError: false
    }))
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'))
})

gulp.task('serve', () => {
  return nodemon({
    script: './dist/main.js',
    watch: './src',
    ext: 'ts',
    tasks: ['compile'],
    delay: 500,
    env: {
      'NODE_ENV': 'development',
      // 'DEBUG': 'Application,Request,Response'
    },
  })
})
