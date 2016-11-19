'use strict';

const nconf = require('nconf');

const pair = require('../modules/handlers/pair');

exports.register = function (server, options, next) {
    server.route({
        method: 'POST',
        path: '/pair',
        handler: pair.post
    });    

    server.route({
        method: 'GET',
        path: '/pair/{code}',
        handler: pair.get
    });    
    
    server.route({
        method: 'DELETE',
        path: '/pair/{uuid}',
        handler: pair.delete
    });    
    
    next();
}

exports.register.attributes = {
    'name': 'pair'
};