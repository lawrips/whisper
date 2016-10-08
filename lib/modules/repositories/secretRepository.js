'use strict';

const nconf = require('nconf');
    
const log = require('../services/loggingService');

const prefix = 's:';
const ttl = nconf.get('system:keyTTL') ? Number.parseInt(nconf.get('system:keyTTL')) : 86400;  

// setup redis instance
let redis = require('./redisFactory')('keyServer');

module.exports = {
	
	set : function(developerId, key, secret, callback) {		
        log.debug(['setting secret for key %s', key]);

		redis.set(prefix + ':' + key, JSON.stringify({'secret' : secret, idx: developerId}), function(err, result) {
            if (err) {
                log.warning(['error on setting secret in redis: %s', err]);
                return callback(err);                
            }
            log.debug(['successfully set secret for key %s', key]);
			redis.expire(prefix + ':' + key, ttl, function(err, result) {
                log.debug(['successfully expred secret for key %s', key]);
                return callback(null);
			});
		});
	},
	
	get : function (developerId, key, callback) {
        log.debug(['getting secret for key %s for developerId %s', key, developerId]);
		redis.get(prefix + ':' + key, function (err, secret) {
			if (err) return callback(err);
            log.debug(['got secret for key %s for developerId %s', key, developerId]);
			secret = JSON.parse(secret);
            if (secret && (secret.idx == developerId || developerId == 1)) {
                delete secret.idx;
                return callback(null, secret);
            }
            else {
                return callback (null, null);
            }            
		});
	},
	
	expire : function (developerId, key) {		
		// if there is a key of this kind, then delete it and set the expiry time
        log.debug(['about to expire secret for key %s for developerId %s', key, developerId]);
        
        // todo: at the moment, anyone can remove / delete a key - consider putting same deveioperId check in her
		redis.set(prefix + ':' + key, JSON.stringify({'secret' : null, idx: developerId, expiredAt : new Date()}), function(err, result) {
            log.debug(['expired secret for key %s for developerId %s', key, developerId]);
			// something in the future
		});
	},

	remove : function (developerId, key) {
        log.debug(['about to remove secret for key %s for developerId %s', key, developerId]);
        // todo: at the moment, anyone can remove / delete a key - consider putting same deveioperId check in her
        redis.del(prefix + developerId + ':' + key);
	}
}