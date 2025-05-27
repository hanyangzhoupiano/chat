const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({server});

const accounts = [
    {username: "hanyangzhou", password: "hz092012"},
    {username: "Kage_Umbra", password: "DonLorenzoSigma8812"},
    {username: "guest", password: "1234"}
];

const configuration = {
    rate_limits: {
        time: 1000,
        requests: 5
    }
};

const request = new Map(); 

wss.on('connection', ws => {
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
                    // Rate Limiting

                    if (!request_limits.has(ws.clientId)) {
                        request_limits.set(ws.clientId, {requests: [], warn: false});
                    }
                    
                    let now = Date.now();
                    let limits = request_limits.get(ws.clientId);
                    let timestamps = limits.requests;
                    let warned = limits.warn;
                    
                    timestamps.push(now);
                    timestamps = timestamps.filter(timestamp => now - timestamp < configuration.rate_limits.time);
                    
                    limits.requests = timestamps;
                    
                    if (timestamps.length > configuration.rate_limits.requests) {
                        if (!warned) {
                            ws.send(JSON.stringify({
                                "username": "System",
                                "action": "send",
                                "message": "You are currently being rate-limited.",
                                "tags": JSON.stringify(["error"])
                            }));
                    
                            limits.warn = true;
                            request_limits.set(ws.clientId, limits);
                    
                            setTimeout(() => {
                                limits.warn = false;
                                request_limits.set(ws.clientId, limits);
                            }, 5000);
                        }
                        return;
                    }

                    // Message Logic
                    
                    try {
                        let [username, password] = data.key.split("/");
                        if (accounts.some(account => account.username === username && account.password === password)) {
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
                        } else {
                            ws.send(JSON.stringify({
                                "username": "System",
                                "action": "send",
                                "message": "Invalid credidentials.",
                                "tags": JSON.stringify(["error"])
                            }));
                        };
                    } catch (e) {
                        ws.send(JSON.stringify({
                            "username": "System",
                            "action": "send",
                            "message": "Invalid credidentials.",
                            "tags": JSON.stringify(["error"])
                        }));
                    };
    
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
                            };
                    
                            commands[commandName](...args);
                        };
                    };
                };
            };
        } catch (error) {
            console.warn("Error: " + error);
        };
    });
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));
