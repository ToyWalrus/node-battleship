import Coordinate from '../../../shared/model/coordinate';
import Grid from '../../../shared/model/grid';
import { Vector2, IRenderable } from '../../../shared/utils/interfaces';
import { Assets, Direction, GamePhase } from '../../../shared/utils/enums';
import GridSquareView from './gridSquareView';
import { coordinateIsInList, loopThroughGrid } from '../../../shared/utils/functions';
import { GridSquareDimensions } from '../../../shared/utils/constants';
import ShipView from './shipView';
import Player from '../../../shared/model/Player';
import { Math } from 'phaser';

type GridSquareClickCallback = (grid: Grid, coord: Coordinate) => void;

export default class GridView implements IRenderable {
	gridRef: Grid;
	gridSquares: Map<string, GridSquareView>;
	isActive: boolean;
	owner: Player;
	scale: number;
	gridSquareClickCallback: GridSquareClickCallback;

	previousDragOriginCoordinate: Coordinate;
	previousFacingDirection: Direction;
	previousPosition: Vector2;

	constructor(grid: Grid, owner?: Player, callback?: GridSquareClickCallback) {
		this.gridRef = grid;
		this.owner = owner;
		this.gridSquares = new Map<string, GridSquareView>();
		this.isActive = true;
		this.gridSquareClickCallback = callback;
		loopThroughGrid((coord: Coordinate) => {
			this.gridSquares.set(coord.toString(), new GridSquareView(coord, this));
			return false;
		});
	}

	setOwner(owner: Player) {
		this.owner = owner;
	}

	render(scene: Phaser.Scene, gridCenter: Vector2, scale: number) {
		this.scale = scale;
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
			const modifiedScale = scale - scale / 40;
			square.render(scene, { x: xOffset, y: yOffset }, modifiedScale);
		});
	}

	updateGridRef(grid: Grid): void {
		this.gridRef = grid;

		if (grid) {
			for (const coord of grid.markedSquares) {
				this.getSquare(coord).markSquare(grid.get(coord).hasShip);
			}
		}
	}

	onGridSquareClicked(coordinate: Coordinate): void {
		if (this.isActive && this.gridSquareClickCallback) {
			this.gridSquareClickCallback(this.gridRef, coordinate);
		} else {
			console.log(`Clicked on ${coordinate}`);
		}
	}

	onShipPlaced(ship: ShipView, originCoordinate: Coordinate): boolean {
		if (!this.isActive || this.owner !== ship.owner) return false;
		let success = ship.place(this, originCoordinate);
		if (success) {
			// console.log('placed ship:');
			// console.log(this.gridRef.toString());
			// reposition ship within the grid
			this.alignPlacedShip(ship, originCoordinate);
			this.unhighlightAllSquares();
		}
		return success;
	}

	setActive(active: boolean) {
		if (this.isActive === active) return;
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

	alignPlacedShip(ship: ShipView, originCoordinate: Coordinate) {
		const originBounds = this.getSquare(originCoordinate).bounds;
		const length = ship.shipRef.length;
		let additionalShift = 0;
		if (length % 2 === 0) {
			// for even-length ships, shift by 1/2 square to line it up
			// since objects origins are the center
			additionalShift = GridSquareDimensions.width / 2;
		}
		const shiftAmount = Math.CeilTo(length / 2) - 1;
		const pixelsToShift = (shiftAmount * GridSquareDimensions.width + additionalShift) * this.scale;

		let newShipPos: Vector2;
		switch (ShipView.currentFacingDirection) {
			case Direction.Right:
				newShipPos = { x: originBounds.centerX + pixelsToShift, y: originBounds.centerY };
				break;
			case Direction.Up:
				newShipPos = { x: originBounds.centerX, y: originBounds.centerY - pixelsToShift };
				break;
			case Direction.Left:
				newShipPos = { x: originBounds.centerX - pixelsToShift, y: originBounds.centerY };
				break;
			case Direction.Down:
				newShipPos = { x: originBounds.centerX, y: originBounds.centerY + pixelsToShift };
				break;
		}
		ship.sceneObject.setPosition(newShipPos.x, newShipPos.y);
	}

	getSquare(coord: Coordinate): GridSquareView {
		return this.gridSquares.get(coord.toString());
	}
}
