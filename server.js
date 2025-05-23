const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(`Received: ${message}`);
        ws.send(`Echo: ${message}`);
    });
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));