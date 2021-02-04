import { Row } from '../utils/enums';
import Math from '../utils/math';

export default class Coordinate {
	row: Row;
	col: integer;

	constructor(row: Row, col: integer) {
		this.row = row;
		this.col = col;
	}

	offsetBy(colOffset: integer, rowOffset: integer): Coordinate {
		return new Coordinate(Math.Clamp(this.row + rowOffset, 1, 10), Math.Clamp(this.col + colOffset, 1, 10));
	}

	equals(obj: any): boolean {
		return obj instanceof Coordinate && obj.col === this.col && obj.row === this.row;
	}

	toString(): string {
		let rowName = 'A';
		rowName = String.fromCharCode(rowName.charCodeAt(0) + (this.row - 1));
		return `(${rowName}, ${this.col})`;
	}

	static fromJson(json: object): Coordinate {
		return new Coordinate(json['row'], json['col']);
	}
}
