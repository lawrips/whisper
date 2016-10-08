'use strict';

const nconf = require('nconf'),
    http = require('request'),
    Slack = require('slack-node');

// setup whisper sdk
const Whisper = require('whisper-ws');
const whisper = new Whisper({ token: nconf.get('slack:whisperDeveloperKey'), developerUrl: nconf.get('system:apiUrl') });

// setup redis instance
let redis = require('../repositories/redisFactory')('configServer');

const configPrefix = 'c-slacktoken-';

// other stuff
const log = require('../services/loggingService'),
    encryptionService = require('../services/encryptionService'),
    keyService = require('../services/keyService'),
    defaults = require('../services/defaults');

let clientId = nconf.get('slack:clientId');
let clientSecret = nconf.get('slack:clientSecret');

// startup by loading bots from redis
_loadBots();

module.exports = {

    get : function (request, reply) {
        return reply.view('slack', {defaults: defaults}, {layout: 'header' });        
    },
    
    // inbound requests occur when someone tries to add the slack command to their team
    auth: function (request, reply) {
        if (request.query && request.query.code) {
            // format is:
            // { code: '2xxxxxxx.2xxxxxxx.fxxxxxx', state: '' }            

            log.info(['Inbound auth request: %s', JSON.stringify(request.query)])
            let code = request.query.code;

            http('https://slack.com/api/oauth.access?client_id=' + clientId + '&client_secret=' + clientSecret + '&code=' + code,
                (error, response, body) => {
                    // format is:
                    // {"ok":true,
                    // "access_token":"access_token", // use this for bot stuff or web api. not needed for slash commands
                    // "scope":"identify,commands", // my defaults
                    // "team_name":"whisper", // team name
                    // "team_id":"teamid"} // team id
                    // "bot_acess_token":"xoxb-etc"} // biot access token
                    if (error) {
                        log.warning('auth error from slack: ' + error);
                    }
                    let oauthResponse = JSON.parse(body); 
                    log.info(['Response from slack oauth: %s', body])

                    // encrypt the bot_access_token
                    let iv = keyService.create(16);
                    let teamId = oauthResponse.team_id;
                    let accessToken = encryptionService.encrypt(oauthResponse.bot.bot_access_token, iv, nconf.get('slack:encryptionPassword'));
                    
                    // store bot_access_token in redis
                    redis.hset(configPrefix + 'tokens', teamId, JSON.stringify({accessToken: accessToken, iv: iv}));
                    log.info(['Set bot access token %s for teamid %s in redis', accessToken, teamId])

                    _loadBots();
                    // todo: store team name for additional security
                    // create a nice "confirmed" page
                    return reply.view('slack', {success: true, defaults: defaults}, {layout: 'header'});
                });
        }
        else {
            return reply().code(401);
        }
    },

    post: function (request, reply) {
        if (request.payload.token == nconf.get('slack:commandToken')) {
            // validate we have the team 
            if (slacks[request.payload.team_id]) {
            // todo: confirm team id was a valid one
            whisper.set(request.payload.text, (err, result) => {
                if (err) {
                    log.error(['error on slack.post: %s',err]);
                    return reply({text: 'Error: ' + err.message, response_type: 'ephemeral'}).code(200);
                }
                log.error('successfully created a new secret from slack');
                let text= '@' + request.payload.user_name + ' shared a secret using the slash command /whisper:\n' + result.webUrl;

                // send back the temporary response
                //reply({text: '@whisper is preparaing a one-time URL. The result will be sent to this channel', response_type: 'ephemeral'}).code(200);
                reply().code(200);                
                
                // now send the url to the channel
                slacks[request.payload.team_id].api('chat.postMessage', {
                    text: text,
                    link_names:1,
                    channel:request.payload.channel_id,
                    username: 'whisper'
                }, function(err, response){
                    log.info(['received response from slack %s', JSON.stringify(response)]);
                });
                return;
            });
            }
            else {
                log.warning('correct payload from slack.post but team not found');
                return reply({text: 'team not found, please try again later or reauthorize /whisper', response_type: 'ephemeral'}).code(200);                
            }
        }
        else {
            log.warning('incorrect payload received from slack.post');
            return reply({text: 'invalid token, please check setup', response_type: 'ephemeral'}).code(200);
        }
    }
}

var slacks = {};

function _loadBots() {
    redis.hgetall(configPrefix + 'tokens', (err, result) => {
        if (err) return log.warning('error calling _loadBoats: ' + err.message);
        Object.keys(result).forEach((teamId) => {
            try {
                // get the encrypted access token
                let accessToken = encryptionService.decrypt(JSON.parse(result[teamId]).accessToken, JSON.parse(result[teamId]).iv, nconf.get('slack:encryptionPassword'));
                
                // if there is an existing slack loaded but the token is different, reinitialize
                if (slacks[teamId] && slacks[teamId] != accessToken) {
                    log.info(['existing slack instance for teamid %s, but different token. updating', teamId]);
                    slacks[teamId] = new Slack(accessToken);                                  
                }
                // alternatively, if it doens't exist, load it
                else if (!slacks[teamId]) {
                    log.info(['new slack instance for teamid %s', teamId]);
                    slacks[teamId] = new Slack(accessToken);                                 
                }
                else {
                    log.info(['no change in bot_access_token for teamid %s', teamId]);                
                }
            } catch (ex) {
                log.warning(`error on starting up slack bot for team ${teamId}. Deleting`);
                redis.hdel(configPrefix + 'tokens', teamId);
            }
        });
    });
}