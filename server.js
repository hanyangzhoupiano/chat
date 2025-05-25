const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    ws.send(JSON.stringify({
        "username": "System",
        "action": "send",
        "message": "Welcome to the chatroom!"
    }));
    ws.on('message', message => {
        try {
            let data = JSON.parse(message);
            let commands = {
                "say": function(message) {
                    if (message) {
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    "username": "System",
                                    "action": "send",
                                    "message": message
                                }));
                            };
                        });
                    };
                },
                "random": function() {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN && data.message && data.time && data.tags) {
                            client.send(JSON.stringify({
                                "username": "System",
                                "action": "send",
                                "message": "Generated a random integer from 1 to 100: " + Math.floor(Math.random() * 99 + 1)
                            }));
                        };
                    });
                }
            };

            if (data.username && data.action) {
                if (data.action == "send") {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "username": data.username,
                                "action": "send",
                                "message": data.message || "",
                                "time": data.time || "",
                                "tags": data.tags || JSON.stringify([])
                            }));
                        };
                    });
    
                    if (data.message.startsWith("/")) {
                        let args = data.message.split(" ");
                        let commandName = args.shift().substring(1);
                    
                        if (commands[commandName]) {
                            let expectedArgs = commands[commandName].length;
                    
                            if (args.length > expectedArgs) {
                                args = [
                                    ...args.slice(0, expectedArgs - 1),
                                    args.slice(expectedArgs - 1).join(" ")
                                ];
                            }
                    
                            commands[commandName](...args);
                        }
                    }
                };
            };
        } catch (error) {
            console.warn("Error: " + error);
        };
    });
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));
