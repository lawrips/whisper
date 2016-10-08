'use strict';

const jsStringEscape = require('js-string-escape'),
    UrlPattern = require('url-pattern'),
    nconf = require('nconf'),
    async = require('async');

const keyRepository = require('../repositories/keyRepository'),
    secretRepository = require('../repositories/secretRepository'),
    keyService = require('../services/keyService'),
    encryptionService = require('../services/encryptionService'),
    developerService = require('../services/developerService'),
    ThrottleService = require('../services/throttleService'),
    developers = require('../../../config/developers.json'),
    log = require('../services/loggingService');

const apiUrl =  nconf.get('system:apiUrl') + 'url/';
const webUrl =  nconf.get('system:webUrl') + 'i/';
const pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)(/*)')

const postCodesToCheck = ['201'];
const getCodesToCheck = ['404', '*'];

module.exports = {
    post: function (request, reply) {
        // check valid token
        var token = request.headers['token'];
        if (!developerService.validate(token)) {
            log.info('Auth failed for a developer API request')
            return reply({message: 'Incorrect token'}).code(401);
        }

        var throttle = _getThrottleRate(request, token);; 

        var maxLength = Number.parseInt(developers[token].maxPostLength || nconf.get('system:maxPostLength'));
        throttle.areRatesExceeded(postCodesToCheck, false, (err, rateExceeded) => {
            // if any of the throttles said their rate was exceeded, respond accordingly
            if (rateExceeded && developers[token].keyRateLimit) {
                log.warning('Developer token limit exceeded')
                return reply({message: 'Developer token limit exceeded. Try again in a short while'}).code(429);
            }
            else if (rateExceeded && developers[token].ipRateLimit) {
                log.warning('IP address rate limit exceeded')
                return reply({message: 'IP address rate limit exceeded. Try again in a short while'}).code(429);
            }
            else if (request.payload.secret.length > maxLength) {
                log.warning('Max size limit exceeded');
                return reply({message: 'Max content size exceeded (' + maxLength + ' chars)'}).code(413);
            }

            // PROCEED
            // STORE THE PASSWORD
            // create an IV - this is what eventually goes into the URL
            var iv = keyService.create(16);
            // create a password to encrypt the user's data with
            var password = keyService.create(32);            
            // create 'padding' to decrease the guessability of the URL - we just prepend to the IV in the URL
            var salt = keyService.create(nconf.get('system:saltLength'));
            // now one-way hash the salt and IV so it can't be looked up in the DB. 
            var hash = encryptionService.hashKey(salt + iv);
            // store the encrypted password with the hash[salt + iv] (i.e. the one time url) as the index
            keyRepository.set(hash, password);

            // STORE THE SECRET
            // get the developerId that will be used in the index
            var developerId = developers[token].id;
            // using the iv and password, encrypt the user's secret 
            var secret = request.payload;
            secret = encryptionService.encrypt(jsStringEscape(secret.secret), iv, password);
            // now store the hased password with the encrypted secret 
            secretRepository.set(developerId, hash, secret, (err) => {
                if (err) return reply('error writing to db').code(500);
                var result = { statusCode: 201, 
                    message: {
                        'key': salt + iv,  
                        'webUrl': webUrl + salt + iv,  
                        'apiUrl': apiUrl + salt + iv
                    }  
                };
                // todo: error handling here
                log.info('Successful POST of a secret from the API')
                return reply(result.message).code(201);
            });
        });
    },

    get: function (request, reply) {
        // check valid token
        var token = request.headers['token'];
        if (!developerService.validate(token)) {
            log.info('Auth failed for a developer API request')
            return reply({message: 'Incorrect token'}).code(401);
        }

        // automatically reject any bots as these can expire the url on preview
        // todo: make this search an array of blacklisted user agents
        if (!request.headers['user-agent'] || request.headers['user-agent'].toLowerCase().indexOf('bot') > -1) {
            return reply({ message: 'user agent missing or not allowed' }).code(403);
        }
                
        // do a hard rate limit on 404's as this is the most suspicious re security hack
        var throttle = _getThrottleRate(request, token);; 
        throttle.areRatesExceeded(getCodesToCheck, true, (err, rateExceeded) => {
            if (err) return reply(err).code(500);
            // if any of the throttles said their rate was exceeded, respond accordingly
            if (rateExceeded && developers[token].keyRateLimit) {
                log.warning('Developer token limit exceeded')
                return reply({message: 'Developer token limit exceeded. Try again in a short while'}).code(429);
            }
            else if (rateExceeded && developers[token].ipRateLimit) {
                log.warning('IP address rate limit exceeded')
                return reply({message: 'IP address rate limit exceeded. Try again in a short while'}).code(429);
            }
            
            // PROCEED
            // get the developerId that will be used in the index
            var developerId = developers[token].id;
            getSecret(developerId, request.params.url, null, (secretErr, result) => { 
                if (secretErr) {
                    result.message = secretErr.message;
                    delete result.secret;
                    // don't return. we'll continue on and update the throttle cache
                    reply(result).code(secretErr.statusCode);
                }
                else {
                    // don't return. we'll continue on and update the throttle cache
                    log.info('Successful GET of a secret from the API')
                    reply(result);
                }

                // now we have the actual respnose (e.g. 200, 404, etc) - update the throttle cache again
                var responseCode = secretErr ? secretErr.statusCode : '*';
                throttle.isRateExceeded(responseCode, false, (err, rateExceeded) => {
                    // no need to respond - just log
                    //   if (rateExceeded) return reply().code(429);
                });
            });
        });
    }
}

function getIfUrl(potentialUrl) {
    if (!potentialUrl) {
        potentialUrl = '';
    }
    // make sure it's a single word (e.g. "www.google.com"" will match, "www.google.com - google" will not)
    if (potentialUrl.split(' ').length == 1) {
        // check if it's a url
        if (pattern.match(potentialUrl)) {
            // add a preceding http:// if missing                            
            if (potentialUrl.indexOf('htt') != 0) {
                potentialUrl = 'http://' + potentialUrl;
            }
            return potentialUrl;
        }
    }
    return null;
}


function getSecret(developerId, key, res, callback) {
    var salt = key.slice(0, nconf.get('system:saltLength'));
    var iv = key.slice(nconf.get('system:saltLength'))
    var hashedKey = encryptionService.hashKey(salt + iv);

    keyRepository.get(hashedKey, function (err, password) {
        if (err) return callback(err);

        secretRepository.get(developerId, hashedKey, function (err, secret) {
            if (err) return callback(err);

            var result = {};

            if (secret && secret.secret) {
                // decrypt the secret
                secret.secret = encryptionService.decrypt(secret.secret, iv, password);
                result = secret;
    
                // now expire it in redis
                keyRepository.expire(hashedKey);
                secretRepository.expire(developerId, hashedKey);
            }
            else if (secret && secret.expiredAt) {
                // return result to the user
                err = { statusCode: 410, message: 'Expired. Secret already retrieved' };
                result = secret;
            }
            else {
                err = { statusCode: 404, message: 'No secret found at this URL' };
            }
            return callback(err, result);
        });
    });
}

var _getThrottleRate = function(request, token) {
        // this is a reserved variable for developers that are not throttled (e.g. the whisper.ws website which manages its own)
        if (developers[token].noApiLimit == true || developers[token].noApiLimit == 'true') {
            log.info(`No api throttling for ${token}`);
            return new ThrottleService(token, null);            
        }
        else if (developers[token].keyRateLimit) {
            var throttle = new ThrottleService(token, developers[token].keyRateLimit);
            log.info(`Setting rate limit for ${token} : ${throttle}`);
            return throttle;
        }
        else if (developers[token].ipRateLimit) {
            var throttle = new ThrottleService(ThrottleService.getIpAddress(request), developers[token].ipRateLimit);
            log.info(`Setting rate limit for ${token} : ${throttle}`);
            return throttle;
        }    
}
