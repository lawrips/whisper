'use strict';

const nconf = require('nconf'),
    Redis = require('ioredis');

const log = require('../services/loggingService');

function redisFactory(server) {
    const redisOptions = nconf.get('redis:' + server);
    let redis;
    if (Array.isArray(redisOptions)) {
        const redisPass = nconf.get('whisper_' + server + '_password') ? {redisOptions: {password: nconf.get('whisper_' + server + '_password')}} : null;
        redis = new Redis.Cluster(redisOptions, redisPass);
    }
    else {
        if (nconf.get('whisper_' + server + '_password')) {
            redisOptions.password = nconf.get('whisper_' + server + '_password');
        }
        redis = new Redis(redisOptions);
    }
    redis.on("connect", () => log.warning('established redis connection for ' + server));
    redis.on("error", (err) => log.warning('error on redis connection for ' + server + '. retry should be invoked: ' + err));

    return redis;
}

module.exports = redisFactory;