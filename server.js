const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    wss.on('message', message => {
        try {
            let data = JSON.parse(message);

            if (data.username && data.message) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            "username": data.username,
                            "message": data.message
                        }));
                    };
                });
            };
        } catch (error) {
            console.warn("Error: " + error);
        };
    });
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));
