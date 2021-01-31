import Coordinate from './coordinate';
import Ship from './ship';

interface PlayerArgs {
	name?: string;
	guessedCoordinates?: Coordinate[];
}

export default class Player {
	private _name: string;
	private _guessedCoordinates: Coordinate[];
	private _selectedShip: Ship;
	private _ships: Ship[];

	get selectedShip(): Ship {
		return this._selectedShip;
	}
	get hasSelectedShip(): boolean {
		return !!this.selectedShip;
	}
	get name(): string {
		return this._name;
	}

	constructor({ name, guessedCoordinates }: PlayerArgs) {
		this._name = name || 'Player';
		this._guessedCoordinates = guessedCoordinates || [];
		this._ships = [];
		this._selectedShip = null;
	}

	selectShip(ship: Ship): void {
		this._selectedShip = ship;
	}

	deselectShip(): void {
		this._selectedShip = null;
	}

	placeShip(): void {
		if (!this.hasSelectedShip) {
			console.warn(`Cannot place ship for ${this.name}; nothing selected!`);
			return;
		}
		this._ships.push(this._selectedShip);
		this._selectedShip = null;
	}

	guessCoordinate(coordinate: Coordinate) {
		if (this._guessedCoordinates.includes(coordinate)) {
			console.log(`${this._name} has already guessed ${coordinate.toString()}`);
			return;
		}
		this._guessedCoordinates.push(coordinate);
	}

	allShipsAreSunk(): boolean {
		return this._ships.length > 0 && this._ships.every((s) => s.isSunk);
	}
}
