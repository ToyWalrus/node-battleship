import { v4 as UuidV4 } from 'uuid';
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
	private _gridRef: Grid;
	private _length: integer;
	private _hasBeenPlaced: boolean;
	private _id: string;

	get id(): string {
		if (!this._id) {
			this._id = UuidV4();
		}
		return this._id;
	}
	get hasBeenPlaced(): boolean {
		return this._hasBeenPlaced;
	}
	get isSunk(): boolean {
		return this._damage.length == this._length;
	}
	get length(): integer {
		return this._length;
	}

	constructor({ length, grid, coordinates, damage }: ShipArgs) {
		this._length = length;
		this._coordinates = coordinates || [];
		this._damage = damage || [];
		this._gridRef = grid;
		this._hasBeenPlaced = (coordinates?.length || 0) > 0;
	}

	place(grid: Grid, placeSpot: Coordinate, facingDirection: Direction): boolean {
		this._gridRef = grid;

		if (!this._checkIfInBounds(placeSpot, facingDirection)) {
			console.log('Cannot place -- not in bounds!');
			return false;
		}
		if (!this._checkNotOverlappingExistingShips(placeSpot, facingDirection)) {
			console.log('Cannot place -- overlapping existing ship!');
			return false;
		}

		this._placeAllShipParts(placeSpot, facingDirection);
		this._hasBeenPlaced = true;
		return true;
	}

	removeFromGrid(): void {
		if (this._gridRef == null) return;

		this._coordinates.forEach((coordinate) => {
			this._gridRef.get(coordinate).removeShipPart();
		});

		this._hasBeenPlaced = false;
		this._coordinates = [];
		this._damage = [];
	}

	setCoordinates(coordinates: Coordinate[]): void {
		this._placeAllShipPartsOnCoordinates(coordinates);
		this._hasBeenPlaced = true;
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

	private _checkIfInBounds(startSpot: Coordinate, dir: Direction): boolean {
		// Subtracting length by 1 so the math is 0-based and will line
		// up with the rows and columns being 1-based
		let shipLength = this.length - 1;
		switch (dir) {
			case Direction.Left:
				return startSpot.col - shipLength >= 1;
			case Direction.Up:
				return startSpot.row - shipLength >= 1;
			case Direction.Right:
				return startSpot.col + shipLength <= 10;
			case Direction.Down:
				return startSpot.row + shipLength <= 10;
			default:
				console.error(`Why are we here?? Given direction must have been null: ${dir}`);
				return false;
		}
	}

	private _checkNotOverlappingExistingShips(startSpot: Coordinate, dir: Direction): boolean {
		let coords = this._getSpotsFor(startSpot, dir);
		for (const coord of coords) {
			if (this._gridRef.get(coord).hasShip) return false;
		}
		return true;
	}

	private _placeAllShipParts(startSpot: Coordinate, dir: Direction): void {
		let coords = this._getSpotsFor(startSpot, dir);
		this._placeAllShipPartsOnCoordinates(coords);
	}

	private _placeAllShipPartsOnCoordinates(coords: Coordinate[]): void {
		this._coordinates = [];
		for (const coord of coords) {
			this._coordinates.push(coord);
			this._gridRef.get(coord).placeShipPart(this);
		}
	}

	private _getSpotsFor(startSpot: Coordinate, dir: Direction): Coordinate[] {
		let spots: Coordinate[] = [];
		let shipLength = this.length - 1;
		let startRowVal = startSpot.row;
		switch (dir) {
			case Direction.Left:
				for (let col = startSpot.col; col >= startSpot.col - shipLength; --col) {
					spots.push(new Coordinate(startSpot.row, col));
				}
				break;
			case Direction.Up:
				for (let row = startRowVal; row >= startRowVal - shipLength; --row) {
					spots.push(new Coordinate(row, startSpot.col));
				}
				break;
			case Direction.Right:
				for (let col = startSpot.col; col <= startSpot.col + shipLength; ++col) {
					spots.push(new Coordinate(startSpot.row, col));
				}
				break;
			case Direction.Down:
				for (let row = startRowVal; row <= startRowVal + shipLength; ++row) {
					spots.push(new Coordinate(row, startSpot.col));
				}
				break;
		}
		return spots;
	}
}
