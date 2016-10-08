'use strict';

const nconf = require('nconf');

const log = require('../services/loggingService'),
    defaults = require('../services/defaults');

const redirectUrl =  nconf.get('system:webUrl') + '/i/';

module.exports = {
    get: function (request, reply) {
        // if the system is not requiring an invitation code, just load
        log.info('loading create page');        
        return reply.view('create', { title: 'whisper', redirectUrl: redirectUrl, defaults: defaults }, {layout: 'headless' })            
    }
}

