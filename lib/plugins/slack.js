'use strict';

var slack = require('../modules/handlers/slack');

var routePrefix = '/slack'

exports.register = function (server, options, next) {
    // SLACK FUNCTIONS
    // OAUTH
    server.route({
        method: 'GET',
        path:  routePrefix,
        handler: slack.get
    });

    server.route({
        method: 'GET',
        path:  routePrefix + '/auth',
        handler: slack.auth
    });

    server.route({
        method: 'POST',
        path:  routePrefix + '/message',
        handler: slack.post
    });
    next();
}

exports.register.attributes = {
    'name': 'slack'
};