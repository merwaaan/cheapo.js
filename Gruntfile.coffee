module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  BUILD = grunt.option('build') or 'debug'
  RELEASE = BUILD is 'release'
  DEBUG = not RELEASE

  grunt.initConfig

    browserify:
      options:
        transform: ['coffeeify']
        browserifyOptions:
          debug: DEBUG
          extensions: ['.coffee']
      dist:
        files:
          'cheapo.js': 'src/cheapo.coffee'

    uglify:
      dist:
        files:
          'cheapo.js': 'cheapo.js'

    watch:
      scripts:
        files: 'src/*.coffee'
        tasks: 'browserify'

  if DEBUG
    tasks = ['browserify', 'watch']
  else
    tasks = ['browserify', 'uglify']

  grunt.registerTask 'default', tasks
