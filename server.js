const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    ws.send(JSON.stringify({
        username: "System",
        message: "Welcome to the chatroom!"
    }));
    ws.on('message', message => {
        try {
            let data = JSON.parse(message);
            let commands = {
                "say": function(message) {
                    if (message) {
                        ws.send(JSON.stringify({
                            username: "System",
                            message: message
                        }));
                    };
                },
                "random": function() {
                    ws.send(JSON.stringify({
                        username: "System",
                        message: "Generated a random integer from 1 to 100: " + Math.floor(Math.random() * 99 + 1)
                    }));
                }
            };

            if (data.username && data.message) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            "username": data.username,
                            "message": data.message
                        }));
                    };
                });

                if (data.message[0] == "/") {
                    let args = data.message.split(" ");
                    let commandName = args.shift().substring(1);
        
                    if (commands[commandName] && args.length >= commands[commandName].length) {
                        let command = commands[commandName](...args);
    
                        command();
                    };
                };
            };
        } catch (error) {
            console.warn("Error: " + error);
        };
    });
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));
