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
	console.log('Server started! yay!');
	new GameManager(io, true);
});
