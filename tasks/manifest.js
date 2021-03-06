/*
 * grunt-manifest
 * https://github.com/gunta/grunt-manifest
 *
 * Copyright (c) 2015 Gunther Brunner, contributors
 * Licensed under the MIT license.
 * https://github.com/gunta/grunt-manifest/blob/master/LICENSE-MIT
 */

'use strict';
module.exports = function (grunt) {

  grunt.registerMultiTask('manifest', 'Generate HTML5 cache manifest', function () {

    var options = this.options({verbose: true, timestamp: true});
    var done = this.async();

    grunt.verbose.writeflags(options, 'Options');

    var path = require('path');

    this.files.forEach(function (file) {

      var files;
      var cacheFiles = options.cache;
      var contents = 'CACHE MANIFEST\n';

      // if hash options is specified it will be used to calculate
      // a hash of local files that are included in the manifest
      var hasher;

      if (options.hash) {
        hasher = require('crypto').createHash('sha256');
      }

      // check to see if src has been set
      if (typeof file.src === "undefined") {
        grunt.fatal('Need to specify which files to include in the manifest.', 2);
      }

      // if a basePath is set, expand using the original file pattern
      if (options.basePath) {
        files = grunt.file.expand({cwd: options.basePath}, file.orig.src);
      } else {
        files = file.src;
      }

      // Exclude files
      if (options.exclude) {
        files = files.filter(function (item) {
          return options.exclude.indexOf(item) === -1;
        });
      }

      // Set default destination file
      if (!file.dest) {
        file.dest = 'manifest.appcache';
      }

      if (options.verbose) {
        contents += '# This manifest was generated by grunt-manifest HTML5 Cache Manifest Generator\n';
      }

      if (options.timestamp) {
        contents += '# Time: ' + new Date() + '\n';
      }

      if (options.revision) {
        contents += '# Revision: ' + options.revision + '\n';
      }

      // Cache section
      contents += '\nCACHE:\n';

      // add files to explicit cache manually
      if (cacheFiles) {
        cacheFiles.forEach(function (item) {
          contents += encodeURI(item) + '\n';
        });
      }

      // add files to explicit cache
      if (files) {
        files.forEach(function (item) {
          if (options.process) {
            contents += encodeURI(options.process(item)) + '\n';
          } else {
            contents += encodeURI(item) + '\n';
          }

          // hash file contents
          if (options.hash) {
            grunt.verbose.writeln('Hashing ' + path.join(options.basePath, item));
            hasher.update(grunt.file.read(path.join(options.basePath, item)), 'binary');
          }
        });
      }

      // Network section
      if (options.network) {
        contents += '\nNETWORK:\n';
        options.network.forEach(function (item) {
          contents += encodeURI(item) + '\n';
        });
      } else {
        // If there's no network section, add a default '*' wildcard
        contents += '\nNETWORK:\n';
        contents += '*\n';
      }

      // Fallback section
      if (options.fallback) {
        contents += '\nFALLBACK:\n';
        options.fallback.forEach(function (item) {
          contents += encodeURI(item) + '\n';
        });
      }

      // Settings section
      if (options.preferOnline) {
        contents += '\nSETTINGS:\n';
        contents += 'prefer-online\n';
      }

      // output hash to cache manifest
      if (options.hash) {

        // hash masters as well
        if (options.master) {

          // convert form string to array
          if (typeof options.master === 'string') {
            options.master = [options.master];
          }

          options.master.forEach(function (item) {
            grunt.log.writeln('Hashing ' + path.join(options.basePath, item));
            hasher.update(grunt.file.read(path.join(options.basePath, item)), 'binary');
          });
        }

        contents += '\n# hash: ' + hasher.digest("hex");
      }

      grunt.verbose.writeln('\n' + (contents).yellow);

      grunt.file.write(file.dest, contents);

      grunt.log.writeln('File "' + file.dest + '" created.');

      done();

    });

  });

};
