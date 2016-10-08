'use strict';

var whisper = require('../modules/handlers/whisperWeb');

var routePrefix = '/i'

exports.register = function (server, options, next) {
    // CREATE NEW URL
    server.route({
        method: 'POST',
        path:  routePrefix + '/url',
        handler: whisper.post
    });

    // GET URL
    server.route({
        method: 'GET',
        path: routePrefix + '/{url}',
        handler: whisper.get
    });

    next();
}

exports.register.attributes = {
    'name': 'whisperlWeb'
};