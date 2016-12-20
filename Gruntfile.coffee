typescriptFiles = [
    "app/**/*.ts",
    "!app/typings/**/*.*"
]



module.exports = (grunt) ->
  grunt.loadNpmTasks "grunt-typescript"
  grunt.loadNpmTasks "grunt-contrib-handlebars"
  grunt.loadNpmTasks "grunt-contrib-compass"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-concat-sourcemap"
  grunt.loadNpmTasks "grunt-contrib-cssmin"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks 'grunt-newer'
  grunt.loadNpmTasks 'grunt-angular-templates'
  grunt.loadNpmTasks 'grunt-bless'
  grunt.loadNpmTasks 'grunt-play'
  grunt.loadNpmTasks 'grunt-parallel'
  # grunt.loadNpmTasks 'grunt-browserifying'

  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")
    compass: # Compiles scss files into css files
      scrumdo:
        options:
          sassDir: "sass"
          cssDir: "generated_css"
          imagesDir: "img"
          outputStyle: "expanded"
          noLineComments: true
          force: true
          relativeAssets: true
          specify: ["sass/main.scss", "sass/report_print.scss"]

    bless:
      css:
        options:
          cacheBuster: false
          imports: false
          logCount: true
          compress: true
        files:
          'generated_css/scrumdo.css': 'generated_css/main.css'

    ngtemplates:
      app:
        src:      'app/**/**.html'
        dest:     'generated_js/app.templates.js'
        options:
          prefix: "' + staticUrl + '"
          url: (url) -> url
          bootstrap: (module, script) ->
            return 'scrumdoTemplates = function($templateCache, staticUrl){ ' + script + '};'
      # release:
      #   src:      'app/**/**.html'
      #   dest:     'generated_js/app.templates.min.js'
      #   options:
      #     prefix: "' + staticUrl + '"
      #     url: (url) -> url
      #     bootstrap: (module, script) ->
      #       return 'scrumdoTemplates = function($templateCache, staticUrl){ ' + script + '};'
      #     htmlmin:
      #       collapseWhitespace: true
      #       removeComments: true
      #       removeRedundantAttributes: true
    cssmin:
      options:
        keepSpecialComments: 0

      app:
        add_banner:
          options:
            banner: '/* Copyright (C) 2015 ScrumDo LLC - All Rights Reserved. */'
        files:
          'generated_css/scrumdo.min.css': ["generated_css/scrumdo.css"]
          'generated_css/scrumdo-blessed1.min.css': ["generated_css/scrumdo-blessed1.css"]

      bower:
        add_banner:
          options:
            banner: '/* Copyright (C) 2015 ScrumDo LLC - All Rights Reserved. */'
        files:
          'generated_css/bower.min.css': ["generated_css/bower.css"]


    typescript:
      app:
        src: typescriptFiles,
        dest: 'generated_js/tempcompile/app',
        options:
            module: 'amd', #or commonjs
            target: 'es5', #or es3
            sourceMap: false,
            declaration: false


    watch:
      options:
        interval: 1000
      templates:
        files: ["app/**/*.html"]
        tasks: ["ngtemplates:app","play"]
      sass:
        files: ["sass/**/*.scss"]
        tasks: ["compass:scrumdo", "bless", "cssmin","play"]
      typescript:
        files: typescriptFiles
        tasks: ["newer:typescript:app", "concat:app", "play"]

    concat:

      app:
        src: ["generated_js/tempcompile/app/**/*.*"]
        dest: "generated_js/scrumdo-angular.js"

      bower_css:
        nonull: true
        src: [
            # "bower_components/bootstrap/dist/css/bootstrap.css",  # We do bootstrap via sass in the sass folder now.
            "bower_components/ng-tags-input/ng-tags-input.css",
            "bower_components/ui-select/select.css",
            "bower_components/spectrum/spectrum.css",
            "bower_components/seiyria-bootstrap-slider/css/bootstrap-slider.css",
            "bower_components/ngtoast/dist/ngToast.css",
            "bower_components/angular-ui-tree/dist/angular-ui-tree.min.css",
            "bower_components/angular-hotkeys/build/hotkeys.css",
            "bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css", # updated version
            "bower_components/ng-table/dist/ng-table.min.css",
            "bower_components/angular-xeditable/dist/css/xeditable.min.css"
        ]
        dest: "generated_css/bower.css"
      bower_js:
        nonull: true
        src: [  "bower_components/jquery/dist/jquery.js",
                "bower_components/jquery-ui/jquery-ui.js",
                "bower_components/angular/angular.js",
                "bower_components/ui-select/select.js",
                "bower_components/angular-cookies/angular-cookies.js",
                "bower_components/angular-animate/angular-animate.js",
                "bower_components/angular-route/angular-route.js",
                "bower_components/underscore/underscore.js",
                "bower_components/angular-loading-bar/build/loading-bar.js",
                "bower_components/moment/moment.js",
                "bower_components/moment-timezone/moment-timezone.js",
                "bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
                "bower_components/angular-resource/angular-resource.js",
                "bower_components/ng-tags-input/ng-tags-input.js",
                "bower_components/d3/d3.js",
                "bower_components/d3-tip/index.js",
                "bower_components/spectrum/spectrum.js",
                "bower_components/angular-spectrum-colorpicker/dist/angular-spectrum-colorpicker.js",
                "bower_components/seiyria-bootstrap-slider/js/bootstrap-slider.js",
                "bower_components/angular-bootstrap-slider/slider.js",
                'bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
                "bower_components/ngstorage/ngStorage.js",
                "bower_components/es5-shim/es5-shim.js",
                "bower_components/angular-file-upload/angular-file-upload.js",
                "bower_components/angular-ui-router/release/angular-ui-router.js",
                "bower_components/angular-xeditable/dist/js/xeditable.js",
                "bower_components/angular-sanitize/angular-sanitize.js",
                "bower_components/ngtoast/dist/ngToast.js",
                "js/tree.js",
                "bower_components/angular-ui-tree/dist/angular-ui-tree.js",
                "bower_components/angular-scroll-glue/src/scrollglue.js",
                "bower_components/json3/lib/json3.js",
                "bower_components/ng-sortable/dist/ng-sortable.js",

                "bower_components/bowser/bowser.js",  # Browser sniffer script
                "bower_components/ment.io/dist/mentio-modified.js",  # Mention script // modified version

                # TODO - remove these once we stop offering textangular.
                #"bower_components/textAngular/dist/textAngular-rangy.min.js",
                #"bower_components/textAngular/dist/textAngular-sanitize.min.js",
                #"bower_components/textAngular/dist/textAngularSetup.js",
                #"bower_components/textAngular/dist/textAngular-modified.js",  # MARC - you modified this to not debounce on the first keypress, don't forget.

                "bower_components/angular-hotkeys/build/hotkeys-modified.js", # This is a modified Version

                "bower_components/tinymce-dist/tinymce-modified.js",  # This is a modified Version
                "bower_components/tinymce-dist/plugins/codesample/plugin.js",
                "bower_components/tinymce-dist/plugins/tabfocus/plugin.js",
                "bower_components/tinymce-dist/plugins/paste/plugin.js",
                "bower_components/tinymce-dist/themes/modern/theme.js",
                "bower_components/angular-ui-tinymce/src/tinymce-modified.js",
                "bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js",
                "bower_components/ng-scrollbars/dist/scrollbars.min.js",
                "bower_components/pluralize/pluralize.js",
                "js/svgconnector.js",
                'js/radarchart.js',
                "bower_components/ng-table/dist/ng-table.min.js",
                'js/sortable.js'
              ]
        dest: "generated_js/bower.js"

    clean:
      app: ["generated_js"]

    uglify:
      options:
        mangle: false
        sourceMap: true
      dist:
        files:
          "generated_js/bower.min.js": ["generated_js/bower.js"]
          "generated_js/scrumdo-angular.min.js": ["generated_js/scrumdo-angular.js"]
          "generated_js/app.templates.min.js": ["generated_js/app.templates.js"]

    parallel:
        compile:
            options:
                grunt: true
            tasks: ["typescript", "ngtemplates", "compass"]
        postprocess:
            options:
                grunt: true
            tasks: ["bless", "concat"]
        minify:
            options:
                grunt: true
            tasks: ["uglify", "cssmin"]
    play:
      fanfare:
        file: './sounds/click.mp3'

  grunt.registerTask "default", ["clean", "parallel:compile",  "parallel:postprocess", "parallel:minify"]
