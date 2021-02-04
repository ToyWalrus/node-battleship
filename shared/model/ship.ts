﻿import { v4 as UuidV4 } from 'uuid';
import { Direction } from '../utils/enums';
import { coordinateIsInList } from '../utils/functions';
import Coordinate from './coordinate';
import Grid from './grid';

interface ShipArgs {
	length: integer;
	coordinates?: Coordinate[];
	damage?: Coordinate[];
	grid?: Grid;
}

export default class Ship {
	private _coordinates: Coordinate[];
	private _damage: Coordinate[];
	private _length: integer;
	private _id: string;

	get id(): string {
		if (!this._id) {
			this._id = UuidV4();
		}
		return this._id;
	}
	get isSunk(): boolean {
		return this._damage.length == this._length;
	}
	get length(): integer {
		return this._length;
	}
	get coordinates(): Coordinate[] {
		return this._coordinates;
	}

	constructor({ length, grid, coordinates, damage }: ShipArgs) {
		this._length = length;
		this._coordinates = coordinates || [];
		this._damage = damage || [];
	}

	setCoordinates(coordinates: Coordinate[]): void {
		this._coordinates = [];
		for (const coord of coordinates) {
			this._coordinates.push(coord);
		}
	}

	damage(coordinate: Coordinate): boolean {
		if (!coordinateIsInList(coordinate, this._coordinates)) {
			console.warn(`Tried damaging a ship at ${coordinate}, but this ship does not exist there!`);
			return false;
		}
		if (coordinateIsInList(coordinate, this._damage)) {
			console.warn(
				`This ship already contains a damaged part at ${coordinate}, why are you kicking the man while he's down??`
			);
			return false;
		}

		this._damage.push(coordinate);

		return this.isSunk;
	}

	static fromJson(json: object): Ship {
		let ship = new Ship({ length: json['_length'] });
		ship._id = json['_id'];
		ship._coordinates = (json['_coordinates'] as object[]).map(Coordinate.fromJson);
		ship._damage = (json['_damage'] as object[]).map(Coordinate.fromJson);
		return ship;
	}
}
