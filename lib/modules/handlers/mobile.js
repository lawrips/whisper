'use strict';

const nconf = require('nconf'),
    debug = require('debug')('whisper'), 
    // setup redis instance
    redis = require('../repositories/redisFactory')('configServer');

const log = require('../services/loggingService'),
    webSocketServer = require('../services/webSocketServer'),
    encryptionService = require('../services/encryptionService'),
    keyService = require('../services/keyService');

const serverPassword = nconf.get('whisper_encryptionPassword');

module.exports = {
    post: function (request, reply) {
        if (!request.payload.url || !request.payload.uuid) {
            return reply().code(400)
        }
        
        // encrypt the incoming data first
        var iv = keyService.create(16);
        let encryptedURL  = encryptionService.encrypt(request.payload.url, iv, serverPassword);

        var hashedUuid = encryptionService.hashKey(request.payload.uuid);
        redis.get('paired:' + hashedUuid, (err, result) => {
            log.info('matched ' + hashedUuid + ' and got ' + result);            
            // if it exists
            if (result) {
                // store the URL for this device 
                log.info(`storing the encrypted URL as ${encryptedURL}`);
                redis.set('mobile:' + result, JSON.stringify({iv: iv, url: encryptedURL}));

                // let the device know that it should check for a new message
                log.debug(`sending a ping to hashedUuid ${result}`);

                let res = webSocketServer.send(result, 'get');
                if (res === true) {
                    // reply to the browser
                    return reply().code(201);
                }
                else if (res === false) {
                    return reply().code(404);                
                }
                else {
                    return reply(res);                    
                }
            }
        });
    },

    get: function (request, reply) {
        if (!request.params.uuid) {
            return reply().code(400)
        }

        // hash the incoming data first
        var hashedUuid = encryptionService.hashKey(request.params.uuid);
        log.info(`requesting for ${hashedUuid}`);

        redis.get('mobile:' + hashedUuid, (err, result) => {
            if (err) return reply(err);
            if (!result) {
                log.debug(`no result found for ${hashedUuid}`);
                return reply().code(404);
            }

            log.debug(`retrieved ${result}`);
            let url = encryptionService.decrypt(JSON.parse(result).url, JSON.parse(result).iv, serverPassword);

            return reply({url: url});
        });
    }
}
