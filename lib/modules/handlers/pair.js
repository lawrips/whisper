'use strict';

const nconf = require('nconf'),
    debug = require('debug')('whisper'), 
    // setup redis instance
    redis = require('../repositories/redisFactory')('configServer'),
    // setup twilio instance
    client = require('twilio')('AC0c0b4001516909d621496b88aca448e1', 'cb8a0bb283e4cb625cd89fbef5121354');

var uuid = require('node-uuid');

const log = require('../services/loggingService');
    
module.exports = {
    get: function (request, reply) {
        let code = request.params.code || '';
        redis.get('conf:' + code, (err, result) => {
            redis.del('conf:' + code, 60);
            if (result) {
                console.log(result);
                return reply({'uuid': JSON.parse(result).uuid});
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

        //Send an SMS text message
        client.sendMessage({
            to: request.payload.mobileNumber,
            from: '+12062020340', 
            body: 'Your confirmation code is ' + code 
        }, (err, responseData) => { 
            if (err) {
                debug(err);
                return reply(err);
            }

            debug(responseData.from); // outputs from phone number
            debug(responseData.body);
            
            let obj = {
                msisdn: request.payload.mobileNumber,
                uuid: uuid.v4()
            };

            redis.set('conf:' + code, JSON.stringify(obj));
            redis.expire('conf:' + code, 60);
            return reply(obj);
        });
    }
}

