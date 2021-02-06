import Coordinate from './coordinate';
import Ship from './ship';

export default class GridSquare {
	private _coordinate: Coordinate;
	private _isMarked: boolean;
	// private _shipRef: Ship;
	private _hasShip: boolean;

	get hasShip(): boolean {
		return this._hasShip;
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
		this._hasShip = false;
	}

	mark(): boolean {
		if (this.hasShip && !this.marked) {
			this._isMarked = true;
			return true;
		}

		this._isMarked = true;
		return false;
	}

	setHasShip(hasShip: boolean): void {
		this._hasShip = hasShip;
	}

	static fromJson(json: object): GridSquare {
		if (!json) return null;
		let square = new GridSquare(Coordinate.fromJson(json['_coordinate']));
		square._isMarked = json['_isMarked'];
		square._hasShip = json['_hasShip'];
		return square;
	}
}
