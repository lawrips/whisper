'use strict';

var nconf = require('nconf');

var whisper = require('../modules/handlers/whisperApi');

// routes and version
var version = '/v1.0';

exports.register = function (server, options, next) {
    // CREATE NEW URL
    server.route({
        method: 'POST',
        path: version + '/url',
        handler: whisper.post
    });

    // GET URL
    server.route({
        method: 'GET',
        path: version + '/url/{url}',
        handler: whisper.get
    });

    next();
}

exports.register.attributes = {
    'name': 'whisperApi'
};