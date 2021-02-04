import { v4 as UuidV4 } from 'uuid';
import Coordinate from './coordinate';
import GridSquare from './gridSquare';

interface GridMap {
	[coordinate: string]: GridSquare;
}

interface GridArgs {
	board?: GridMap;
}

export default class Grid {
	private _board: GridMap;
	private _id: string;

	get id(): string {
		if (!this._id) {
			this._id = UuidV4();
		}
		return this._id;
	}

	constructor(args?: GridArgs) {
		if (args?.board != null) {
			this._board = args.board;
		} else {
			this._board = {};
			for (let col = 1; col <= 10; ++col) {
				for (let row = 1; row <= 10; ++row) {
					let current = new Coordinate(row, col);
					this._board[current.toString()] = new GridSquare(current);
				}
			}
		}
	}

	get(coordinate: Coordinate): GridSquare {
		return this._board[coordinate.toString()];
	}

	toString(): string {
		let horizontalBorder = '--------------------';
		let gridString = horizontalBorder + '\n';
		for (let row = 1; row <= 10; ++row) {
			gridString += '| ';
			for (let col = 1; col <= 10; ++col) {
				let current = new Coordinate(row, col);
				if (this.get(current).hasShip && this.get(current).marked) {
					gridString += 'X ';
				} else if (this.get(current).marked) {
					gridString += 'M ';
				} else if (this.get(current).hasShip) {
					gridString += 'S ';
				} else {
					gridString += '~ ';
				}
			}
			gridString += '|\n';
		}
		return gridString + horizontalBorder;
	}

	static fromJson(json: object): Grid {
		if (!json) return null;
		let grid = new Grid();
		grid._id = json['_id'];
		grid._board = {};
		Object.keys(json['_board'] as { [key: string]: any }).forEach((key) => {
			grid._board[key] = GridSquare.fromJson(json['_board'][key]);
		});
		return grid;
	}
}
