import { v4 as UuidV4 } from 'uuid';
import { coordinateIsInList } from '../utils/functions';
import Coordinate from './coordinate';
import Grid from './grid';

interface ShipArgs {
	length: number;
	coordinates?: Coordinate[];
}

export default class Ship {
	private _coordinates: Coordinate[];
	private _length: number;
	private _id: string;

	get id(): string {
		return this._id;
	}
	get length(): number {
		return this._length;
	}
	get coordinates(): Coordinate[] {
		return this._coordinates;
	}

	constructor({ length, coordinates }: ShipArgs) {
		this._length = length;
		this._coordinates = coordinates || [];
		this._id = UuidV4();
	}

	setCoordinates(coordinates: Coordinate[]): void {
		this._coordinates = [];
		for (const coord of coordinates) {
			this._coordinates.push(coord);
		}
	}

	isSunkFrom(guessedCoordinates: Coordinate[]): boolean {
		for (const coord of this._coordinates) {
			if (!guessedCoordinates.some((c) => coord.equals(c))) {
				return false;
			}
		}
		return true;
	}

	static fromJson(json: object): Ship {
		if (!json) return null;
		let ship = new Ship({ length: json['_length'] });
		ship._id = json['_id'];
		ship._coordinates = (json['_coordinates'] as object[]).map(Coordinate.fromJson);
		return ship;
	}
}
