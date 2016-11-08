'use strict';

const WebSocketServer = require('ws').Server,
    messageWss = new WebSocketServer({ port: 6970 }),
    pairingWss = new WebSocketServer({ port: 6971 }),
    queryString = require('query-string'),
    redis = require('../repositories/redisFactory')('configServer');

const log = require('../services/loggingService'),
    encryptionService = require('../services/encryptionService');

let messageWs = {}, pairingWs = {};
let once = false;

messageWss.on('connection', (incoming) => {
    let params = incoming.upgradeReq.url.replace('/?', '');
    // see if requesting client wants to listen for monitor tests only
    let uuid = queryString.parse(params).uuid;
    uuid = encryptionService.hashKey(uuid);
    if (uuid) {
        messageWs[uuid] = incoming;
        log.info('stored incoming messaging web socket connection with uuid ' + uuid);
    }
    else {
        log.info('no uuid not storing messaging connection');
    }     
});
 
pairingWss.on('connection', (incoming) => {
    let params = incoming.upgradeReq.url.replace('/?', '');
    // see if requesting client wants to listen for monitor tests only
    let code = queryString.parse(params).code;
    if (code) {
        pairingWs[code] = incoming;
        log.info('stored incomming web browser connection to pairing web socket');
    }
    else {
        log.info('no uuid not storing pairing connection');
    }     
});
 

module.exports = {
    send : function(uuid, message, callback) {
        // try to get the uuid that is matched 
        if (messageWs[uuid] && messageWs[uuid].readyState === 1) {
            log.info('sending ping to web socket associated with uuid: ' + uuid);
            try {
                messageWs[uuid].send(message);
                return true;
            } catch (ex) {
                log.warning(ex);
                return ex;
            }
        }
        else {
            log.info('cant send ping to web socket as no connection associated with uuid: ' + uuid);
            return false;
        }
    },    

    validated: function (code, uuid) {
        if (pairingWs[code] && pairingWs[code].readyState === 1) {
            log.info('Validated pairing code ' + code + '. Sending uuid to browser web socket');
            pairingWs[code].send(uuid);
        }
        else {
            log.info('Cant send pairing code message to web socket as no associated connection');
        }
    },


}
