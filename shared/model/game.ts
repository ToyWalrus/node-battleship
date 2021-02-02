import { GamePhase } from '../utils/enums';
import Coordinate from './coordinate';
import Grid from './grid';
import Player from './Player';

export default class Game {
	private _playerGrids: Map<Player, Grid>;
	private _currentPlayerTurn: number;
	private _phase: GamePhase;

	get currentPlayerTurn(): number {
		return this._currentPlayerTurn;
	}
	get players(): Player[] {
		if (this._playerGrids.size == 0) return [];
		let players: Player[] = [];
		for (const entry of this._playerGrids) {
			players.push(entry[0]);
		}
		return players;
	}
	get currentPlayer(): Player {
		return this.players[this.currentPlayerTurn];
	}
	get currentPhase(): GamePhase {
		return this._phase;
	}

	constructor(startPlayerTurn = 0) {
		this._currentPlayerTurn = startPlayerTurn;
		this._playerGrids = new Map<Player, Grid>();
		this._phase = GamePhase.Waiting;
	}

	// test
	manualUpdatePhase(phase: GamePhase) {
		this._phase = phase;
	}

	startGame(): boolean {
		if (this.players.length < 2) {
			console.warn('Not enough players to start game!');
			this._phase = GamePhase.Waiting;
			return false;
		}
		this._phase = GamePhase.Guessing;
		return true;
	}

	getGridFor(player: Player): Grid | null {
		if (this._playerGrids.has(player)) {
			return this._playerGrids.get(player);
		}
		return null;
	}

	addPlayer(player: Player, grid: Grid): void {
		this._playerGrids.set(player, grid);
	}

	isPlayerTurn(player: Player): boolean {
		return player.name === this.currentPlayer.name;
	}

	gridSquareClicked(player: Player, grid: Grid, coordinate: Coordinate): boolean {
		switch (this._phase) {
			case GamePhase.Waiting:
				break;
			case GamePhase.Guessing:
				if (this.isPlayerTurn(player) && grid !== this.getGridFor(player)) {
					return this.guessSquare(player, coordinate);
				} else {
					console.log(
						`${player.name} clicked square in guessing phase, but it either wasn't their turn or was the wrong grid.`
					);
					return false;
				}
				break;
			default:
				return false;
		}
	}

	guessSquare(guessingPlayer: Player, coordinate: Coordinate): boolean {
		let guessingGrid = this.getGridFor(guessingPlayer);
		if (!guessingGrid || guessingGrid.get(coordinate).marked) return false;

		guessingPlayer.guessCoordinate(coordinate);
		return guessingGrid.get(coordinate).mark();
	}

	endCurrentTurn(): void {
		this._currentPlayerTurn = (this._currentPlayerTurn + 1) % 2;
	}
}
