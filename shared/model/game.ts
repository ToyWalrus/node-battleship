import { GamePhase } from '../utils/enums';
import Coordinate from './coordinate';
import Grid from './grid';
import Player from './Player';

interface PlayerIdToGridId {
	[id: string]: string;
}
interface PlayerIdToPlayer {
	[id: string]: Player;
}
interface GridIdToGrid {
	[id: string]: Grid;
}

export default class Game {
	private _playerIdToGridId: PlayerIdToGridId;
	private _players: PlayerIdToPlayer;
	private _grids: GridIdToGrid;
	private _currentPlayerTurn: number;
	private _phase: GamePhase;

	get players(): Player[] {
		if (Object.keys(this._players).length === 0) return [];
		return Object.values(this._players);
	}
	get currentPlayer(): Player {
		return this.players[this.currentPlayerTurn];
	}
	get currentPhase(): GamePhase {
		return this._phase;
	}
	get started(): boolean {
		return this._phase !== GamePhase.Waiting;
	}
	get currentPlayerTurn(): number {
		return this._currentPlayerTurn;
	}

	constructor(startPlayerTurn = 0) {
		this._currentPlayerTurn = startPlayerTurn;
		this._playerIdToGridId = {};
		this._players = {};
		this._grids = {};
		this._phase = GamePhase.Waiting;
	}

	// test
	manualUpdatePhase(phase: GamePhase) {
		this._phase = phase;
	}

	startGame(): boolean {
		if (this.started) return false;
		if (this.players.length < 2) {
			console.warn('Not enough players to start game!');
			this._phase = GamePhase.Waiting;
			return false;
		}
		this._phase = GamePhase.Guessing;
		return true;
	}

	getGridFor(player: Player): Grid | null {
		if (player && this._playerIdToGridId[player.id]) {
			const gridId = this._playerIdToGridId[player.id];
			return this._grids[gridId];
		}
		return null;
	}

	getGridForOpponent(player: Player): Grid | null {
		if (!player || this.players.length < 2) return null;
		for (const p of this.players) {
			if (p.id !== player.id) {
				const gridId = this._playerIdToGridId[p.id];
				return this._grids[gridId];
			}
		}
		return null;
	}

	addPlayer(player: Player, grid: Grid): void {
		this._playerIdToGridId[player.id] = grid.id;
		this._players[player.id] = player;
		this._grids[grid.id] = grid;
	}

	isPlayerTurn(player: Player): boolean {
		return player?.id === this.currentPlayer?.id;
	}

	gridSquareClicked(player: Player, grid: Grid, coordinate: Coordinate): boolean {
		if (this._phase !== GamePhase.Guessing) {
			throw 'Cannot click square in any phase except guessing!';
		}

		if (player && grid && this.isPlayerTurn(player) && grid.id !== this.getGridFor(player)?.id) {
			return this.guessSquare(player, grid, coordinate);
		} else {
			console.log(`${player?.name} clicked square, but it either wasn't their turn or was the wrong grid.`);
			return false;
		}
	}

	guessSquare(guessingPlayer: Player, guessingGrid: Grid, coordinate: Coordinate): boolean {
		if (!guessingGrid || guessingGrid.get(coordinate).marked) return false;
		guessingPlayer.guessCoordinate(coordinate);
		return guessingGrid.get(coordinate).mark();
	}

	endCurrentTurn(): void {
		this._currentPlayerTurn = (this._currentPlayerTurn + 1) % 2;
	}

	static fromJson(json: object): Game {
		if (!json) return null;
		let game = new Game();
		game._currentPlayerTurn = json['_currentPlayerTurn'];
		game._phase = json['_phase'];
		game._players = {};
		game._grids = {};

		game._playerIdToGridId = json['_playerIdToGridId'];
		Object.keys(game._playerIdToGridId).forEach((key) => {
			game._players[key] = Player.fromJSON(json['_players'][key]);
			game._grids[game._playerIdToGridId[key]] = Grid.fromJson(json['_grids'][game._playerIdToGridId[key]]);
		});

		return game;
	}
}
