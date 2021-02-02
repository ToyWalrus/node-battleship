import Coordinate from '../model/coordinate';

interface GridLoopCallback {
	(coordinate: Coordinate): boolean | void;
}

/**
 * Loops through each grid square, doing
 * full rows before moving onto the next.
 * @param callback A callback for each coordinate
 * in the grid. If the callback returns `true`, the
 * function will exit the loop.
 */
export const loopThroughGrid = (callback: GridLoopCallback) => {
	for (let row = 1; row <= 10; ++row) {
		for (let col = 1; col <= 10; ++col) {
			if (callback(new Coordinate(row, col))) {
				return;
			}
		}
	}
};

export const coordinateIsInList = (coordinate: Coordinate, list: Coordinate[]) => {
	return list.some((c) => (c && c.equals(coordinate)) || (!c && !coordinate));
};
