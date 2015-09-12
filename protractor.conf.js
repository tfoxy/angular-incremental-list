(function() {
  'use strict';

  /* global exports, process */

  // For pausing the browser with protractor:
  require('events').EventEmitter.defaultMaxListeners = 100;

  var PORT = 8000;

  var config = {
    baseUrl: 'http://localhost:' + PORT + '/e2e/',

    capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        // When using travis, --no-sandbox arg is pushed to args
        args: []
      }
    },

    specs: ['e2e/**/*.js'],

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
      showColors: true,
      defaultTimeoutInterval: 30000
    },

    onPrepare: function() {
      var finalhandler = require('finalhandler');
      var http = require('http');
      var serveStatic = require('serve-static');

      // Serve up public/ftp folder
      var serve = serveStatic('.');

      // Create server
      var server = http.createServer(function(req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
      });

      // Listen
      server.listen(PORT);
    }
  };

  if (process.env.TRAVIS) {
    config.capabilities.chromeOptions.args.push('--no-sandbox');
  }

  exports.config = config;
})();
