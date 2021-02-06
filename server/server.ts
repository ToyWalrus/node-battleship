import { ServerInfo } from '../shared/communications';
import GameManager from './gameManager';

const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
	cors: {
		origin: /localhost/,
		methods: ['GET', 'POST'],
	},
});

http.listen(ServerInfo.port, () => {
	const isDebug = process.argv[process.argv.length - 1] === 'true';
	if (isDebug) {
		console.log('Server started! yay!');
	}
	new GameManager(io, isDebug);
});
