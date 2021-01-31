import Coordinate from '../model/coordinate';
import Grid from '../model/grid';
import { Vector2, IRenderable } from '../utils/interfaces';
import { Assets, Direction, GamePhase } from '../utils/enums';
import GridSquareView from './gridSquareView';
import { coordinateIsInList, loopThroughGrid } from '../utils/functions';
import Game from '../model/game';
import { GridSquareDimensions } from '../utils/constants';
import ShipView from './shipView';
import Player from '../model/Player';

export default class GridView implements IRenderable {
	gameRef: Game;
	gridRef: Grid;
	gridSquares: Map<string, GridSquareView>;
	isActive: boolean;
	owner: Player;

	previousDragOriginCoordinate: Coordinate;
	previousFacingDirection: Direction;
	previousPosition: Vector2;

	constructor(grid: Grid, game: Game, owner: Player) {
		this.gridRef = grid;
		this.gameRef = game;
		this.owner = owner;
		this.gridSquares = new Map<string, GridSquareView>();
		this.isActive = true;
		loopThroughGrid((coord: Coordinate) => {
			this.gridSquares.set(coord.toString(), new GridSquareView(coord, this));
			return false;
		});
	}

	render(scene: Phaser.Scene, gridCenter: Vector2, scale: number) {
		let grid = scene.add.image(gridCenter.x, gridCenter.y, Assets.Grid).setScale(scale).setInteractive();
		const bounds = grid.getBounds();
		const topLeft = grid.getTopLeft();

		scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (!this.owner?.hasSelectedShip) {
				this.previousDragOriginCoordinate = null;
				this.previousFacingDirection = null;
				this.previousPosition = null;
			}
			this.highlightAllSquaresUnderDraggedShip(bounds, pointer.x, pointer.y);
		});
		scene.input.keyboard.on('keydown-Q', () =>
			this.highlightAllSquaresUnderDraggedShip(bounds, this.previousPosition?.x, this.previousPosition?.y)
		);
		scene.input.keyboard.on('keydown-E', () =>
			this.highlightAllSquaresUnderDraggedShip(bounds, this.previousPosition?.x, this.previousPosition?.y)
		);

		this.gridSquares.forEach((square) => {
			const coord = square.coordinate;
			const squareSize = GridSquareDimensions.width * scale;
			const offset = squareSize / 2;

			const xOffset = topLeft.x + squareSize * coord.col + offset;
			const yOffset = topLeft.y + squareSize * coord.row + offset;

			// scale is modified so we can see grid lines between the squares
			const modifiedScale = scale - scale / 20;
			square.render(scene, { x: xOffset, y: yOffset }, modifiedScale);
		});
	}

	onGridSquareClicked(coordinate: Coordinate) {
		console.log(`Clicked on ${coordinate}`);
	}

	onShipPlaced(ship: ShipView, originCoordinate: Coordinate): boolean {
		if (!this.isActive || this.owner !== ship.owner) return false;
		return ship.shipRef.place(this.gridRef, originCoordinate, ShipView.currentFacingDirection);
	}

	setActive(active: boolean) {
		this.isActive = active;
		this.gridSquares.forEach((square) => square.setActive(active));
	}

	unhighlightAllSquares() {
		loopThroughGrid((coord: Coordinate) => {
			this.getSquare(coord).clearTint();
		});
	}

	highlightAllSquaresUnderDraggedShip(bounds: Phaser.Geom.Rectangle, pointerX: number, pointerY: number) {
		if (
			this.gameRef.currentPhase === GamePhase.Setup &&
			this.owner?.hasSelectedShip &&
			pointerX !== null &&
			pointerY !== null &&
			bounds.contains(pointerX, pointerY)
		) {
			// First get the origin coordinate
			let originCoordinate: Coordinate;
			loopThroughGrid((coord: Coordinate) => {
				if (this.getSquare(coord).onPointerMove(pointerX, pointerY)) {
					originCoordinate = coord;
					return true;
				}
			});
			if (
				!originCoordinate ||
				(originCoordinate.equals(this.previousDragOriginCoordinate) &&
					this.previousFacingDirection === ShipView.currentFacingDirection)
			) {
				return;
			}

			// Next get the list of coordinates the boat spans
			let length = this.owner.selectedShip.length;
			let coordinates: Coordinate[] = [originCoordinate];
			let offsetBy = (count: number): Coordinate => {
				switch (ShipView.currentFacingDirection) {
					case Direction.Right:
						return originCoordinate.offsetBy(count, 0);
					case Direction.Up:
						return originCoordinate.offsetBy(0, -count);
					case Direction.Left:
						return originCoordinate.offsetBy(-count, 0);
					case Direction.Down:
						return originCoordinate.offsetBy(0, count);
				}
			};
			for (let i = 0; i < length; ++i) {
				let nextCoord = offsetBy(i);
				if (!nextCoord.equals(coordinates[coordinates.length - 1])) {
					coordinates.push(nextCoord);
				}
			}

			// Lastly, highlight each of the squares it covers
			for (const coord of coordinates) {
				this.getSquare(coord).tintSquare();
			}
			// And un highlight the rest
			loopThroughGrid((coord: Coordinate) => {
				if (!coordinateIsInList(coord, coordinates)) {
					this.getSquare(coord).clearTint();
				}
			});

			// And update the thingies
			this.previousDragOriginCoordinate = originCoordinate;
			this.previousFacingDirection = ShipView.currentFacingDirection;
			this.previousPosition = { x: pointerX, y: pointerY };
		}
	}

	getSquare(coord: Coordinate): GridSquareView {
		return this.gridSquares.get(coord.toString());
	}
}
