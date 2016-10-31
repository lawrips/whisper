'use strict';

const nconf = require('nconf'),
    debug = require('debug')('whisper'), 
    // setup redis instance
    redis = require('../repositories/redisFactory')('configServer');

const log = require('../services/loggingService'),
    webSocketServer = require('../services/webSocketServer');

module.exports = {
    post: function (request, reply) {
        console.log(`sending a ping to ${request.payload.uuid}`);
        console.log(`storing ${request.payload.url}`);
        redis.set('mobile:' + request.payload.uuid, request.payload.url);
        //webSocketServer.send(request.payload.url);
        webSocketServer.send('get');
        return reply().code(201);
    },

    get: function (request, reply) {
        console.log(`requesting for ${request.params.uuid}`);
        redis.get('mobile:' + request.params.uuid, (err, result) => {
            console.log(result);
            return reply({url: result});
        });
    }
}
