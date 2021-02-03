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

		io.on(CONNECTION, this.playerConnected);
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
			this.broadcastEvent(GAME_STARTED, { game }, roomId);
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
			}

			game.endCurrentTurn();
			this.broadcastEvent(UPDATE_GAME, { game }, args.roomId);
		} catch (e) {
			this._log('Clicking square failed: ', e);
		}
	}

	// ====================
	//   CONNECTION LOGIC
	// ====================

	playerConnected(socket: Socket): void {
		this._log('User connected! ', socket);
		this.playerConnections.set(socket, null);

		// Setup callbacks
		socket.on(DISCONNECT, () => this.playerDisconnected(socket));
		socket.on(JOIN_GAME, (args) => this.playerJoinedGame(socket, args));
		socket.on(START_GAME, this.startGame);
		socket.on(CLICK_SQUARE, this.clickSquare);
	}

	playerDisconnected(socket: Socket): void {
		this._log('User disconnected! ', socket);
		this.playerConnections.delete(socket);
	}

	playerJoinedGame(socket: Socket, args: JoinGameArgs): void {
		if (!args) {
			this._warn('Player joined game but no arguments were sent');
			return;
		}
		const roomId = args.roomId;
		this.playerConnections.set(socket, roomId);
		socket.join(roomId);

		let game = this.games.get(roomId);
		if (!game) {
			game = new Game();
			this.games.set(roomId, game);
		}
		if (game.started) {
			this._warn('Player joined a game that has already started!');
			return;
		}

		game.addPlayer(args.player, args.grid);
		if (game.players.length === 2) {
			this.broadcastEvent(GAME_READY, null, roomId);
		}
	}

	broadcastEvent(event: string, args: any, roomId: string): void {
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
