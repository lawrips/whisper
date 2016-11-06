'use strict';

const WebSocketServer = require('ws').Server,
    messageWss = new WebSocketServer({ port: 6970 }),
    pairingWss = new WebSocketServer({ port: 6971 }),
    queryString = require('query-string');

let messageWs = {}, pairingWs = {};
var once = false;

messageWss.on('connection', (incoming) => {
    console.log('messaging socket connected');

    let params = incoming.upgradeReq.url.replace('/?', '');
    // see if requesting client wants to listen for monitor tests only
    let uuid = queryString.parse(params).uuid;
    if (uuid) {
        messageWs[uuid] = incoming;
        console.log('stored web socket connection');
    }
    else {
        console.log('no uuid not storing connection');
    }     
});
 
pairingWss.on('connection', (incoming) => {
    let params = incoming.upgradeReq.url.replace('/?', '');
    // see if requesting client wants to listen for monitor tests only
    let code = queryString.parse(params).code;
    if (code) {
        pairingWs[code] = incoming;
        console.log('paring socket connected');
    }
    else {
        console.log('no uuid not storing connection');
    }     
});
 

module.exports = {
    send : function(uuid, message) {
        if (messageWs[uuid] && messageWs[uuid].readyState === 1) {
            console.log('sending to web socket');
            try {
                messageWs[uuid].send(message);
            } catch (ex) {
                console.log(ex);
            }
        }
        else {
            console.log('no websockets connected');
        }
    },    

    validated: function (code, uuid) {
        if (pairingWs[code] && pairingWs[code].readyState === 1) {
            console.log('sending to web socket');
            pairingWs[code].send(uuid);
        }
        else {
            console.log('no websockets connected');
        }
    },


}
