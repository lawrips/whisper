'use strict';

const nconf = require('nconf');

const mobile = require('../modules/handlers/mobile');

exports.register = function (server, options, next) {
    server.route({
        method: 'POST',
        path: '/mobile',
        handler: mobile.post
    });    

    server.route({
        method: 'GET',
        path: '/mobile/{uuid}',
        handler: mobile.get
    });    

    next();
}

exports.register.attributes = {
    'name': 'mobile'
};