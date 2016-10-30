var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 6970 });

let ws;
wss.on('connection', function connection(incoming) {
    ws = incoming;
    console.log('connected');
});
 

module.exports = {
    send : function(message) {
        if (ws && ws.readyState === 1) {
            console.log('connecting');
            ws.send(message);
        }
        else {
            console.log('no websockets connected');
        }

    }    
}
