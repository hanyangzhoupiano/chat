const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
	console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({server});

const accounts = new Map([
    [1, {username: "hanyangzhou", password: "hz092012", perms: 3}],
    [2, {username: "arjunjain", password: "aj090612", perms: 0}],
    [3, {username: "Kage_Umbra", password: "DonLorenzoSigma8812", perms: 0}],
    [4, {username: "moderator", password: "Lw357935Zy", perms: 1}],
    [5, {username: "admin", password: "Lw357935Zy", perms: 2}],
    [6, {username: "guest", password: "1234", perms: 0}]
]);
const roles = {
    0: "Default",
    1: "Moderator",
    2: "Administrator",
    3: "Owner"
};
const online_members = new Set();
const muted_users = new Set();
const banned_users = new Set();

// add typing messages

const configuration = {
    rate_limits: {
		time: 500,
		requests: 3
	}
};

const request_limits = new Map();

wss.on('connection', ws => {
	ws.on('message', message => {
		try {
			let data = JSON.parse(message);
			let commands = {
                "say": {
                    callback: function(message) {
						if (message) {
							wss.clients.forEach(client => {
								if (client.readyState === WebSocket.OPEN) {
									client.send(JSON.stringify({
                                        "username": "System",
                                        "action": "send",
                                        "message": message
									}));
								}
							});
						}
					},
					permission_level: 1
				},
                "ban": {
                    callback: function() {
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    "username": "System",
                                    "action": "send",
                                    "message": "banning coming soon"
                                }));
                            }
                        });
                    },
					permission_level: 1
				},
                "unban": {
                    callback: function() {
						wss.clients.forEach(client => {
							if (client.readyState === WebSocket.OPEN) {
								client.send(JSON.stringify({
                                    "username": "System",
                                    "action": "send",
                                    "message": "unbanning coming soon"
								}));
							}
						});
					},
					permission_level: 1
				},
                "mute": {
                    callback: function() {
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    "username": "System",
                                    "action": "send",
                                    "message": "muting coming soon"
                                }));
                            }
                        });
    				},
    				permission_level: 1
				}
			};

			if (data.username && data.action) {
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

				try {
					let [username, password] = data.key.split("/");
					let account = [...accounts.values()].find(account => account.username === username && account.password === password);
					if (account) {
						switch (data.action) {
						case "send":
							// Message Logic

							if (data.message.startsWith("/")) {
								let arguments = data.message.split(" ");
								let command_name = args.shift().substring(1);
								let command = commands[command_name];

								if (command) {
									let permission_level = command.permission_level;
									let expected_arguments = command.callback.length;

									if (arguments.length > expected_arguments) {
										arguments = [
                                            ...arguments.slice(0, expectedArgs - 1),
                                            arguments.slice(expectedArgs - 1).join(" ")
                                        ];
									}

									if (account.permission_level >= permission_level) {
										command(...arguments);
									} else {
										ws.send(JSON.stringify({
                                            "username": "System",
                                            "action": "send",
                                            "message": "Insufficient permissions.",
                                            "tags": JSON.stringify(["error"])
										}));
									}
								}
							}
							wss.clients.forEach(client => {
								if (client.readyState === WebSocket.OPEN) {
									client.send(JSON.stringify({
                                        "username": data.username,
                                        "action": "send",
                                        "message": data.message || "",
                                        "time": data.time || "",
                                        "tags": data.tags || JSON.stringify([])
									}));
								}
							});
							break;
						case "update":
							wss.clients.forEach(client => {
								if (client.readyState === WebSocket.OPEN) {
									client.send(JSON.stringify({
                                        "username": data.username,
                                        "action": "update",
                                        "tags": data.tags || JSON.stringify([])
									}));
								}
							});
							break;
						default:
							return;
						}
					} else {
						ws.send(JSON.stringify({
                            "username": "System",
                            "action": "send",
                            "message": "Invalid credidentials.",
                            "tags": JSON.stringify(["error"])
						}));
						ws.close();
					}
				} catch (e) {
					ws.send(JSON.stringify({
                        "username": "System",
                        "action": "send",
                        "message": "Invalid credidentials: " + e,
                        "tags": JSON.stringify(["error"])
					}));
					ws.close();
				}
			}
		} catch (error) {
			console.warn("Error: " + error);
			return;
		}
	});
});

app.get('/', (req, res) => res.send('WebSocket server is running!'));
