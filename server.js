#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var uuid = require('node-uuid');
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8000, function() {
    console.log((new Date()) + ' Server is listening on port 8000');
});


wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

class Message {
    constructor(author, id, content) {
        this.author = author;
        this.content = content;
        this.id = id;
    }

    toString() {
        return JSON.stringify(this);
    }
}

const messages = [];

const connections = [];


wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);

    connections.push(connection);

    console.log((new Date()) + ' Connection accepted. size . =' + connections.length);

    connection.sendUTF(JSON.stringify(messages));

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            messages.push(message.utf8Data);

            connections.forEach((connect) => {
                if (connect.state === 'open') {
                    connect.sendUTF(JSON.stringify(messages));
                }
            });
        }


        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.', reasonCode);
    });
});