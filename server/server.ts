const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
	cors: {
		origin: /localhost/,
		methods: ['GET', 'POST'],
	},
});

let players = [];

io.on('connection', (socket) => {
	console.log('user connected! ', socket.id);
	players.push(socket.id);

	if (players.length === 1) {
		io.emit('isPlayerA');
	}

	socket.on('methodA', () => {
		console.log("Server trigger 'methodA'");
		io.emit('methodA');
	});

	socket.on('disconnect', () => {
		console.log('user disconnected! ', socket.id);
		players = players.filter((p) => p !== socket.id);
	});
});

http.listen(3000, () => {
	console.log('server started! yay!');
});
