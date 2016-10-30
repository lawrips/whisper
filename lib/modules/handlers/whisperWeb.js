'use strict';

const jsStringEscape = require('js-string-escape'),
    UrlPattern = require('url-pattern'),
    http = require('request'),
    async = require('async'),
    nconf = require('nconf');
    

const secretRepository = require('../repositories/secretRepository'),
    keyRepository = require('../repositories/keyRepository'),
    keyService = require('../services/keyService'),
    encryptionService = require('../services/encryptionService'),
    ThrottleService = require('../services/throttleService'),
    developers = require('../../../config/developers.json'),
    log = require('../services/loggingService'),
    defaults = require('../services/defaults');

const Whisper = require('whisper-ws');
const whisper = new Whisper({ token: nconf.get('whisper_websiteDeveloperKey'), developerUrl: nconf.get('system:apiUrl') });

let pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)(/*)')

let getCodesToCheck = ['404', '*'];
let postCodesToCheck = ['201'];


module.exports = {
    post: function (request, reply) {
        // first throttle based on source ip
        // do a hard rate limit on 404's as this is the most suspicious re security hack
        var throttle = new ThrottleService(ThrottleService.getIpAddress(request), developers[nconf.get('whisper_websiteDeveloperKey')].ipRateLimit);
        var maxLength = Number.parseInt(nconf.get('system:maxPostLength') || 2000);
        
        throttle.areRatesExceeded(postCodesToCheck, false, (err, rateExceeded) => {
            // if any of the throttles said their rate was exceeded, respond accordingly
            if (rateExceeded) {
                log.warning('IP request limit exceeded');
                return reply('IP request limit exceeded. Try again in a short while').code(429);
            }
            else if (request.payload.secret.length > maxLength) {
                log.warning('Max size limit exceeded');
                return reply('Max content size exceeded (' + maxLength + ' chars)').code(413);
            }

            // everything is ok - now do the post
            whisper.set(request.payload.secret, (err, result) => {
                if (err) return reply(err);
                // reply back 201
                log.info('Successful POST of a secret from the Website');
                return reply(result).code(201);
            });
        });
    },

    get: function (request, reply) {
        if (_isBot(request)) {
            return reply('User-Agent not allowed').code(403);
        }
        else {
            let format = request.query.format ? request.query.format.toLowerCase() : 'html';
            // first throttle based on source ip
            // do a hard rate limit on 404's as this is the most suspicious re security hack
            var throttle = new ThrottleService(ThrottleService.getIpAddress(request), developers[nconf.get('whisper_websiteDeveloperKey')].ipRateLimit)
            throttle.areRatesExceeded(getCodesToCheck, true, (err, rateExceeded) => {
                if (err) return reply(err).code(500);
                // if any of the throttles said their rate was exceeded, respond accordingly
                if (rateExceeded) {
                    log.warning('IP rate limit exceeded');
                    if (format == 'json') {
                        return reply({secret: {}, 'error': { 'message': 'IP request limit exceeded. Try again in a short while', statusCode: 429 }})                        
                    }
                    else {
                        return reply.view('index', { title: 'whisper.ws', 'error': { 'message': 'IP request limit exceeded. Try again in a short while', statusCode: 429 }, secret: {}, defaults: defaults }, {layout: 'header'})
                    }
                }

                whisper.get(request.params.url, (err, result) => {
                    // todo: handle ERR
                    
                    log.info('GET of a secret from the website');
                    var statusCode = err ? err.statusCode : 200;
                    if (!err) {
                        var secret = result;
                        // redirect if it's a url
                        var url = getIfUrl(secret.secret);
                        if (url) {
                            reply.redirect(url);
                        }
                        else {                                                             
                            let response;
                            // things are good - show the secret
                            if (format == 'json') {
                              response = reply({secret: secret})
                                .header('cache-control', 'no-cache, no-store, must-revalidate')
                                .header('Pragma', 'no-cache')
                                .header('Expires', 0).hold();
                            }
                            else {
                                response = reply.view('index', { title: 'whisper.ws', returningUser: true, secret: secret, error: {}, defaults: defaults }, { layout: 'header'})
                                .header('cache-control', 'no-cache, no-store, must-revalidate')
                                .header('Pragma', 'no-cache')
                                .header('Expires', 0).hold();
                            }
                            response.send();                            
                        }
                    }
                    else if (err.statusCode == 410) {
                        // 410 means secret is expired (don't return as we'll continue after we respond)
                        let response;
                        if (format == 'json') {
                            reply({ secret: { }, 'error': { 'message': 'Secret accessed at ' + err.expiredAt, statusCode: err.statusCode }});
                        }
                        else {
                            reply.view('index', { title: 'whisper.ws', secret: { }, 'error': { 'message': 'Secret accessed at ' + err.expiredAt, statusCode: err.statusCode }, defaults: defaults }, { layout: 'header'})
                        }
                    }
                    else if (err.statusCode == 429) {
                        let response;
                        if (format == 'json') {
                            reply({secret: {}, 'error': { 'message': 'API request limit exceeded. Try again in a short while', statusCode: 429 }})                        
                        }
                        else {
                            reply.view('index', { title: 'whisper.ws', 'error': { 'message': 'API request limit exceeded. Try again in a short while', statusCode: 429 }, secret: {}, defaults: defaults }, { layout: 'header'});                        
                        }
                    }
                    else if (err.statusCode == 404) {
                        // 404 means no secret found
                        let response;
                        if (format == 'json') {
                            reply({secret: {}, 'error': { 'message': 'No secret at this URL', statusCode: err.statusCode }})                        
                        }
                        else {
                            reply.view('index', { title: 'whisper.ws', 'error': { 'message': 'No secret at this URL', statusCode: err.statusCode }, secret: {}, defaults: defaults }, { layout: 'header'});
                        }
                    }
                    else {
                        let response;
                        if (format == 'json') {
                            reply({secret: {}, error: {}})                        
                        }
                        else {
                            // all other error case (unauthorized, etc)
                            reply.view('index', { title: 'whisper.ws', secret: {}, error: {}, defaults: defaults }, { layout: 'header'});
                        }
                    }

                    // now we have the actual response (e.g. 200, 404, etc) - update the throttle cache again
                    throttle.isRateExceeded(statusCode, false, (err, rateExceeded) => {
                        if (rateExceeded) {
                            // don't do anything - just log
                        }
                    });
                });
            });
        }
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


function getSecret(key, res, callback) {
    var salt = key.slice(0, nconf.get('system:saltLength'));
    var iv = key.slice(nconf.get('system:saltLength'))
    var hashedKey = encryptionService.hashKey(salt + iv);

    keyRepository.get(hashedKey, function (err, password) {
        if (err) return callback(err);

        secretRepository.get(hashedKey, function (err, secret) {
            var result = {};

            if (secret.secret) {
                // return result to the user
                secret.secret = encryptionService.decrypt(secret.secret, iv, password);
                result = { statusCode: 200, message: secret.secret };
    
                // now expire it 
                keyRepository.expire(hashedKey);
                secretRepository.expire(hashedKey);
            }
            else if (secret.expiredAt) {
                // return result to the user
                result = { statusCode: 200, message: secret };
            }
            else {
                result = { statusCode: 404, message: 'not found' };
            }
            return callback(err, result);
        });
    });
}

function _isBot(request) {
    var isBot = false;
    nconf.get('system:bots').forEach((bot) => {
        if (request.headers['user-agent'].toLowerCase().indexOf(bot) > -1) {
            isBot = true;
        }    
    });
    return isBot;
}