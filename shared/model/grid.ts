import { v4 as UuidV4 } from 'uuid';
import Coordinate from './coordinate';
import GridSquare from './gridSquare';

interface GridArgs {
	board?: Map<string, GridSquare>;
}

export default class Grid {
	private board: Map<string, GridSquare>; // TODO: will need serialization
	private _id: string;

	get id(): string {
		return this._id;
	}

	constructor(args?: GridArgs) {
		if (args?.board != null) {
			this.board = args.board;
		} else {
			this.board = new Map<string, GridSquare>();
			for (let col = 1; col <= 10; ++col) {
				for (let row = 1; row <= 10; ++row) {
					let current = new Coordinate(row, col);
					this.board.set(current.toString(), new GridSquare(current));
				}
			}
		}
		this._id = UuidV4();
	}

	get(coordinate: Coordinate): GridSquare {
		return this.board.get(coordinate.toString());
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
}
