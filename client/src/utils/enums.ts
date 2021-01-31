export enum Assets {
	Mark = 'Mark',
	Carrier = 'Carrier',
	Battleship = 'Battleship',
	Cruiser = 'Cruiser',
	Destroyer = 'Destroyer',
	Submarine = 'Submarine',
	Grid = 'Grid',
	Square = 'Square',
}

export enum Row {
	A = 1,
	B = 2,
	C = 3,
	D = 4,
	E = 5,
	F = 6,
	G = 7,
	H = 8,
	I = 9,
	J = 10,
}

export enum Direction {
	Up,
	Right,
	Down,
	Left,
}

export enum GamePhase {
	Waiting,
	Setup,
	Guessing,
	End,
}
