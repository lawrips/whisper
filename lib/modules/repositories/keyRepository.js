'use strict'

// npm modules
const nconf = require('nconf');

// my modules
const keyService = require('../services/keyService'),
    encryptionService = require('../services/encryptionService'),
    log = require('../services/loggingService');

const serverPassword = nconf.get('whisper_encryptionPassword');

const prefix = 'k:';
const ttl = nconf.get('system:keyTTL') ? Number.parseInt(nconf.get('system:keyTTL')) : 86400;

// setup redis instance
let redis = require('./redisFactory')('keyServer');

module.exports = {

    set: function (key, password) {
        var iv = keyService.create(16);

        password = encryptionService.encrypt(password, iv, serverPassword);
        log.debug(['setting password for key %s', key]);
        redis.set(prefix + key, JSON.stringify({ iv: iv, password: password }), function (err, result) {
            log.debug(['successfully set password for key %s', key]);
            // log in the future
            redis.expire(prefix + key, ttl, function (err, result) {
                // log in the future
                log.debug(['successfully set expiration %s for redis key %s', ttl, key]);
            });
        });
    },

    get: function (key, callback) {
        log.debug(['getting password for key %s', key]);
        redis.get(prefix + key, function (err, encryptedPassword) {
            if (err) return callback(err);

            log.debug(['got password for key %s', key]);
            if (encryptedPassword) {
                encryptedPassword = JSON.parse(encryptedPassword);
                return callback(null, encryptionService.decrypt(encryptedPassword.password, encryptedPassword.iv, serverPassword));
            }
            else {
                return callback(null, null);
            }
        });
    },

    expire: function (key) {
        redis.del(prefix + key);
    },

    remove: function (key) {
        redis.del(prefix + key);
    }
}

