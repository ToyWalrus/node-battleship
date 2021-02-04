import Coordinate from './model/coordinate';
import Grid from './model/grid';
import Game from './model/game';
import Player from './model/Player';

// =======================
//   METHOD NAMES & ARGS
// =======================
// Note: all args with a roomId are called from client

export const JOIN_GAME = 'JOIN_GAME';
export interface JoinGameArgs {
	player: Player;
	grid: Grid;
	roomId: string;
}

export const START_GAME = 'START_GAME';
export interface StartGameArgs {
	roomId: string;
}

export const CLICK_SQUARE = 'CLICK_SQUARE';
export interface ClickSquareArgs {
	sendingPlayerId: string;
	guessedGridId: string;
	coordinate: Coordinate;
	roomId: string;
}

export const GAME_READY = 'GAME_READY';
export const GAME_STARTED = 'GAME_STARTED';
export const PLAYER_LEAVE = 'PLAYER_LEAVE';
export const UPDATE_GAME = 'UPDATE_GAME';
export interface UpdateGameArgs {
	game: Game;
}

// ===================
//   CONNECTION INFO
// ===================

export const ServerInfo = {
	hostname: 'http://localhost',
	port: 3000,
};
