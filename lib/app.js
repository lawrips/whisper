'use strict';

const vision = require('vision'),
    nconf = require('nconf'),
    Glue = require('glue'),
    async = require('async'),
    handlebars = require('handlebars'),
    extend = require('handlebars-extend-block');

// check startup settings
require('./modules/services/checkSetup');

// register hapi
const Hapi = require('hapi');
var manifest = require('../config/manifest.json');

// get my modules
var log = require('./modules/services/loggingService');

var options = {
    relativeTo: __dirname + '/plugins'
};

// reigster helpers & partials
require('./plugins/register');

// port handling required for azure
manifest.connections[0].port = process.env.PORT || manifest.connections[0].port;

Glue.compose(manifest, options, (err, server) => {
    log.warning('glue startup complete');
    
    // start webserver
    server.start(function (err) {
        // server running on port 8082
        log.warning('whistle-ws started');
    });
    
    // handlebars templating engine
    server.register(vision, (err) => {
        if (err) {
            throw err;
        }

        server.views({
            engines: {
                html: extend(handlebars),
            },
            path: 'views',
            layout: true,
            isCached: false,
            layoutPath: 'views/layouts',
            relativeTo: __dirname,
            compileOptions: {
                pretty: true
            }
        });
    });
});

function done(reply) {
    return (err, result) => {
        if (!err) {
            return reply.continue();
        }
    }
}