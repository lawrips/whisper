'use strict';

const nconf = require('nconf');

const contact = require('../modules/handlers/contact'),
    defaults = require('../modules/services/defaults');

exports.register = function (server, options, next) {
    server.route({
        method: 'GET',
        path: '/about',
        handler: function (request, reply) {
            return reply.view('about', { title: 'About whisper.ws', defaults: defaults }, {layout: 'header'});
        }
    });
    
    server.route({
        method: 'GET',
        path: '/terms',
        handler: function(request, reply) { 
            return reply.view('custom/terms', { title: 'Terms of Service', defaults: defaults}, {layout: 'header'});
        }        
    });    
    next();

    server.route({
        method: 'GET',
        path: '/privacy',
        handler: function(request, reply) { 
            return reply.view('custom/privacy', { title: 'Privacy Policy', defaults: defaults}, {layout: 'header'});
        }        
    });

    server.route({
        method: 'GET',
        path: '/developers',
        handler: function(request, reply) { 
            return reply.view('developers', { title: 'Developers', defaults: defaults}, {layout: 'header'});
        }        
    });

    server.route({
        method: 'GET',
        path: '/contact',
        handler: function(request, reply) { 
            return reply.view('contact', { title: 'Contact Us', defaults: defaults}, {layout: 'header'});
        }        
    });

    server.route({
        method: 'POST',
        path: '/contact',
        handler: contact.post
    });
}

exports.register.attributes = {
    'name': 'links'
};