import { v4 as UuidV4 } from 'uuid';
import Coordinate from './coordinate';
import Ship from './ship';

interface PlayerArgs {
	name?: string;
	guessedCoordinates?: Coordinate[];
	ships?: Ship[];
}

export default class Player {
	private _name: string;
	private _guessedCoordinates: Coordinate[];
	private _selectedShip: Ship;
	private _ships: Ship[];
	private _id: string;

	get id(): string {
		return this._id;
	}
	get selectedShip(): Ship {
		return this._selectedShip;
	}
	get hasSelectedShip(): boolean {
		return !!this.selectedShip;
	}
	get name(): string {
		return this._name;
	}

	constructor(args?: PlayerArgs) {
		this._name = args?.name || 'Player';
		this._guessedCoordinates = args?.guessedCoordinates || [];
		this._ships = args?.ships || [];
		this._selectedShip = null;
		this._id = UuidV4();
	}

	setName(name: string): void {
		this._name = name;
	}

	setShips(ships: Ship[]) {
		this._ships = ships;
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

	static fromJSON(json: object): Player {
		if (!json) return null;
		let player = new Player();
		player._id = json['_id'];
		player._name = json['_name'];
		player._ships = (json['_ships'] as object[]).map(Ship.fromJson);
		player._guessedCoordinates = (json['_guessedCoordinates'] as object[]).map(Coordinate.fromJson);
		return player;
	}
}
