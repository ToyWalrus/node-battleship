import Coordinate from './coordinate';
import Ship from './ship';

export default class GridSquare {
	private _coordinate: Coordinate;
	private _isMarked: boolean;
	private _shipRef: Ship;

	get hasShip(): boolean {
		return this._shipRef != null;
	}
	get marked(): boolean {
		return this._isMarked;
	}
	get coordinate(): Coordinate {
		return this._coordinate;
	}

	constructor(coordinate: Coordinate) {
		this._coordinate = coordinate;
		this._isMarked = false;
		this._shipRef = null;
	}

	mark(): boolean {
		if (this.hasShip && !this.marked) {
			this._shipRef.damage(this._coordinate);
			this._isMarked = true;
			return true;
		}

		this._isMarked = true;
		return false;
	}

	placeShipPart(ship: Ship): void {
		this._shipRef = ship;
	}

	removeShipPart(): void {
		this._shipRef = null;
	}

	static fromJson(json: object): GridSquare {
		if (!json) return null;
		let square = new GridSquare(json['_coordinate']);
		square._isMarked = json['_isMarked'];
		square._shipRef = Ship.fromJson(json['_shipRef']);
		return square;
	}
}
