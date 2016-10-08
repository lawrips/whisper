'use strict';

var inert = require('inert');

exports.register = function (server, options, next) {
    // register static file rendering
    server.register(inert, () => {
        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: './lib/public',
                }
            }
        });
    });

    next();
}

exports.register.attributes = {
    'name': 'view registration'
};