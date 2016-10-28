var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 6970 });

let ws;
wss.on('connection', function connection(incoming) {
    ws = incoming;
    console.log('connected');
});
 

module.exports = {
    send : function(message) {
        ws.send(message);
    }    
}
