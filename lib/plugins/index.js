'use strict';

var index = require('../modules/handlers/index');

exports.register = function (server, options, next) {
    // MAIN PAGE FOR URL CREATION
    server.route({
        method: 'GET',
        path: '/',
        handler: index.get
    });

    next();
}

exports.register.attributes = {
    'name': 'index'
};