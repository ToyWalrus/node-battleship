import { Row } from '../utils/enums';
import Math from '../utils/math';

export default class Coordinate {
	// private static _rand = new Phaser.Math.RandomDataGenerator(new Date().toISOString());

	row: Row;
	col: number;

	constructor(row: Row, col: number) {
		this.row = row;
		this.col = col;
	}

	offsetBy(colOffset: number, rowOffset: number): Coordinate {
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

	// static random(): Coordinate {
	// 	let row = Coordinate._rand.integerInRange(1, 10);
	// 	let col = Coordinate._rand.integerInRange(1, 10);
	// 	return new Coordinate(row, col);
	// }

	static fromJson(json: object): Coordinate {
		if (!json) return null;
		return new Coordinate(json['row'], json['col']);
	}
}
