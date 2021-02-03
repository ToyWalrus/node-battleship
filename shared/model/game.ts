import { GamePhase } from '../utils/enums';
import Coordinate from './coordinate';
import Grid from './grid';
import Player from './Player';

export default class Game {
	private _playerIdToGridId: Map<string, string>;
	private _players: Map<string, Player>;
	private _grids: Map<string, Grid>;
	private _currentPlayerTurn: number;
	private _phase: GamePhase;

	get players(): Player[] {
		if (this._players.size == 0) return [];
		let players: Player[] = [];
		for (const entry of this._players) {
			players.push(entry[1]);
		}
		return players;
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
		this._playerIdToGridId = new Map<string, string>();
		this._players = new Map<string, Player>();
		this._grids = new Map<string, Grid>();
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
		if (this._playerIdToGridId.has(player.id)) {
			const gridId = this._playerIdToGridId.get(player.id);
			return this._grids.get(gridId);
		}
		return null;
	}

	addPlayer(player: Player, grid: Grid): void {
		this._playerIdToGridId.set(player.id, grid.id);
		this._players.set(player.id, player);
		this._grids.set(grid.id, grid);
	}

	isPlayerTurn(player: Player): boolean {
		return player.id === this.currentPlayer.id;
	}

	gridSquareClicked(player: Player, grid: Grid, coordinate: Coordinate): boolean {
		if (this._phase !== GamePhase.Guessing) {
			throw 'Cannot click square in any phase except guessing!';
		}

		if (this.isPlayerTurn(player) && grid.id !== this.getGridFor(player)?.id) {
			return this.guessSquare(player, grid, coordinate);
		} else {
			console.log(`${player.name} clicked square, but it either wasn't their turn or was the wrong grid.`);
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
}
