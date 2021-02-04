import { Server, Socket } from 'socket.io';
import {
	ClickSquareArgs,
	CLICK_SQUARE,
	GAME_READY,
	GAME_STARTED,
	JoinGameArgs,
	JOIN_GAME,
	StartGameArgs,
	START_GAME,
	UPDATE_GAME,
} from '../shared/communication-methods';
import Game from '../shared/model/game';
import Player from '../shared/model/Player';

const CONNECTION = 'connection';
const DISCONNECT = 'disconnect';

export default class GameManager {
	io: Server;
	games: Map<string, Game>;
	playerConnections: Map<Socket, string>;
	debugLog: boolean;

	constructor(io: Server, debugLog = true) {
		this.io = io;
		this.playerConnections = new Map<Socket, string>();
		this.games = new Map<string, Game>();
		this.debugLog = debugLog;

		// Set up the callback for when players connect to the server
		io.on(CONNECTION, this.playerConnected.bind(this));
	}

	// ==============
	//   GAME LOGIC
	// ==============

	startGame(args: StartGameArgs): void {
		if (!args) {
			this._warn('Trying to start game but no arguments were given!');
			return;
		}

		const roomId = args.roomId;
		const game = this.games.get(roomId);

		if (game.startGame()) {
			this._broadcastEvent(GAME_STARTED, { game }, roomId);
		} else {
			this._warn('Game has already started!', { roomId, game });
		}
	}

	clickSquare(args: ClickSquareArgs): void {
		if (!args) {
			this._warn('Tried to click square but no arguments were given!');
			return;
		}

		const roomId = args.roomId;
		const game = this.games.get(roomId);
		try {
			const success = game.gridSquareClicked(args.sendingPlayer, args.grid, args.coordinate);

			if (success) {
				this._log(`${args.sendingPlayer.name} guessed a spot with a ship!`);
			} else {
				this._log(`${args.sendingPlayer.name} guessed a spot without a ship`);
			}

			game.endCurrentTurn();
			this._broadcastEvent(UPDATE_GAME, { game }, args.roomId);
		} catch (e) {
			this._log('Clicking square failed: ', e);
		}
	}

	// ====================
	//   CONNECTION LOGIC
	// ====================

	// Happens when a player registers with the server
	playerConnected(socket: Socket): void {
		this._log('User connected! ', socket.id);
		this.playerConnections.set(socket, null);

		// Setup callbacks
		socket.on(DISCONNECT, () => this.playerDisconnected(socket));
		socket.on(JOIN_GAME, (args, cb) => this.playerJoinedGame(socket, args, cb));
		socket.on(START_GAME, this.startGame.bind(this));
		socket.on(CLICK_SQUARE, this.clickSquare.bind(this));
	}

	// Happens when a player is... you know... disconnected
	playerDisconnected(socket: Socket): void {
		this._log('User disconnected! ', socket.id);
		this.playerConnections.delete(socket);
	}

	// Happens when a player has clicked "Join Game" after placing their ships
	playerJoinedGame(socket: Socket, args: JoinGameArgs, clientJoinGameCallback: (didJoin: boolean) => void): void {
		if (!args) {
			this._warn('Player tried to joined game but no arguments were sent');
			return;
		}

		// Check the room
		const roomId = args.roomId;
		if (socket.rooms.has(roomId)) {
			this._warn(`Player (${args.player.name}) has already joined "${roomId}"`);
			clientJoinGameCallback(false);
			return;
		} else if (this.playerConnections.get(socket) && this.playerConnections.get(socket) !== roomId) {
			this._warn(
				`Player (${
					args.player.name
				}) is trying to game hop over into "${roomId}"! (From ${this.playerConnections.get(socket)})`
			);
			clientJoinGameCallback(false);
			return;
		}

		// Create game/check game status
		let game = this.games.get(roomId);
		if (!game) {
			game = new Game();
			this.games.set(roomId, game);
		}
		if (game.started) {
			this._warn('Player joined a game that has already started!');
			clientJoinGameCallback(false);
			return;
		}

		// Join the room
		this._log(`Player (${args.player.name}) joined game "${args.roomId}"!`);
		this.playerConnections.set(socket, roomId);
		socket.join(roomId);
		clientJoinGameCallback(true);

		// Register player to game
		game.addPlayer(args.player, args.grid);
		if (game.players.length === 2) {
			// Tell clients everything is ready
			this._broadcastEvent(GAME_READY, null, roomId);
		}
	}

	_broadcastEvent(event: string, args: any, roomId: string): void {
		if (!this.games.has(roomId)) {
			this._warn(`There is no room with id ${roomId} to broadcast to!`);
			return;
		}
		this._log(`Broadcasting '${event}' to '${roomId}' with args: `, args);
		this.io.to(roomId).emit(event, args);
	}

	// =================
	//   DEBUG CONSOLE
	// =================

	_log(message: any, ...args: any[]): void {
		if (this.debugLog) {
			console.log(message, ...args);
		}
	}

	_warn(message: any, ...args: any[]): void {
		if (this.debugLog) {
			console.warn(message, ...args);
		}
	}

	_err(message: any, ...args: any[]): void {
		if (this.debugLog) {
			console.error(message, ...args);
		}
	}
}
