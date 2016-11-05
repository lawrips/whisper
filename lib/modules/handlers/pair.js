'use strict';

const nconf = require('nconf'),
    debug = require('debug')('whisper'), 
    // setup redis instance
    redis = require('../repositories/redisFactory')('configServer'),
    // setup twilio instance
    client = require('twilio')('AC0c0b4001516909d621496b88aca448e1', 'cb8a0bb283e4cb625cd89fbef5121354');

var uuid = require('node-uuid');

const log = require('../services/loggingService'),
    webSocketServer = require('../services/webSocketServer');
    
module.exports = {
    
    // called by paired device (i.e. mobile device)
    get: function (request, reply) {
        let code = request.params.code || '';
        
        // try to get the pairing code that is matched 
        redis.get('conf:' + code, (err, result) => {
            
            // if it exists
            if (result) {
                // delete the old one
                redis.del('conf:' + code);

                // set a new flag for the originating device (i.e. browser) to know that pairing was successful
                redis.set('paired:' + result, true);
                console.log('paired ' + result + ' with code ' +  code);

                webSocketServer.validated(code, result);

                // return the generated uuid
                return reply({'uuid': result});
            }
            else {
                console.log('nok');
                return reply({'result':'nok'});
            }
        });
    },

    validate: function (request, reply) {
        let uuid = request.params.uuid || '';
        
        // try to get the uuid that is matched 
        redis.get('paired:' + uuid, (err, result) => {
            console.log('validating ' + uuid + ' and got ' + result);            
            // if it exists
            if (result) {
                // return the generated uuid
                return reply({'result': 'ok'});
            }
            else {
                console.log('nok');
                return reply({'result':'nok'});
            }
        });
    },

    post: function (request, reply) {
        // generate a random code
        let code = Math.floor(Math.random() * (1000000 - 100000) + 100000);

        // Generate a code and store it
        let obj = {code: code, uuid: uuid.v4()};
        redis.set('conf:' + obj.code, obj.uuid);
        redis.expire('conf:' + obj.code, 60);
        return reply(obj);
    }
}

