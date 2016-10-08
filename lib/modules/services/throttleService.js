'use strict';

const Limiter = require('ratelimiter'),
    nconf = require('nconf'),
    async = require('async');   

const log = require('../services/loggingService');

const rateLimitPrefix = 'rl-';

let redis = require('../repositories/redisFactory')('throttleServer');

let heroku = nconf.get('optional:heroku');

function ThrottleService(key, rateLimit) {
    this.rateLimit = rateLimit;
    this.key = key;
}

// Accepts an array of response codes to check
ThrottleService.prototype.areRatesExceeded = function (responseCodes, readOnly, callback) {
    // responseCodes is an array of codes to check against (e.g. 200, 201, 404, etc)
    async.map(responseCodes, (code, mapCallback) => {
        this.isRateExceeded(code, readOnly, (err, rateExceeded) => {
            return mapCallback(err, rateExceeded);
        });
    }, (err, results) => {
        // if any of the throttles said their rate was exceeded, respond accordingly
        if (results.indexOf(true) > -1) {
            return callback(null, true);
        }
        return callback(null, false);
    });
}

// Accepts a single response code to check
ThrottleService.prototype.isRateExceeded = function (responseCode, readOnly, callback) {
    // if no rate limit is set (e.g. in the case of whisper.ws - then we can return 'success' here)
    if (!this.rateLimit) {
        return callback(null, false);
    }
    // check to see if the responseCode is a special case for this developer key / ip        
    // if the response code does not have its own dedicated section, then set it to *
    responseCode = responseCode.toString();
    if (Object.keys(this.rateLimit).indexOf(responseCode) == -1) {
        responseCode = '*';
    }
    var id = '{' + rateLimitPrefix + this.key + '}' + '-' + responseCode;

    var limit = new Limiter({ id: id, db: redis, max: this.rateLimit[responseCode].limitCount, duration: this.rateLimit.limitInterval });

    limit.get(readOnly, function (err, limit) {
        if (err) {
            log.warning(['error on throttle service limit.get: %s', err]);
            return callback(err)
        }
        var remaining = readOnly ? limit.remaining : limit.remaining - 1;
        log.debug(['There are %s requests remaining out of %s for id %s', remaining, limit.total, id]);
        if (!limit.remaining) {
            return callback(null, true);
        }

        return callback(null, false);
    });
}

// workaround for heroku cause they're ip address stuff is weird
var getIpAddress = function(request) {
    var ipAddr;
    if (heroku) {

        ipAddr = request.headers["x-forwarded-for"];
        if (ipAddr) {
            var list = ipAddr.split(",");
            ipAddr = list[list.length - 1];
        } else {
            ipAddr = request.connection.remoteAddress;
        }
    }
    else {
        ipAddr = request.info.remoteAddress;
    }
    return ipAddr;
}

module.exports = ThrottleService;
module.exports.getIpAddress = getIpAddress;