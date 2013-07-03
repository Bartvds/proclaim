module.exports = function (grunt) {
    'use strict';

    var path = require('path');
    var util = require('util');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                // should be ./.jshintrc
                jshintrc: 'test/config/jshint.json'
            },
            all: ['lib/**/*.js', 'test/unit/**/*.js']
        },
        browserify: {
            tests: {
                src : ['lib/**/*.js', 'test/unit/**/*.js'],
                dest : 'test/bundle.js'
            }
        },
        mochaTest: {
            // node-side
            any: {
                src: ['test/unit/**/*.js'],
                options: {
                    reporter: 'Dot'
                }
            }
        },
        mocha: {
            // browser-side
            any: {
                src: ['test/index.html'],
                options: {
                    reporter: 'Dot',
                    log: true,
                    run: true
                }
            }
        }
    });

    grunt.registerTask('default', ['test']);

    grunt.registerTask('build', ['jshint', 'browserify']);
    grunt.registerTask('test', ['build', 'mochaTest', 'mocha']);
};