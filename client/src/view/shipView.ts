import Coordinate from '../../../shared/model/coordinate';
import Player from '../../../shared/model/Player';
import Ship from '../../../shared/model/ship';
import { Direction } from '../../../shared/utils/enums';
import { IRenderable, Vector2 } from '../../../shared/utils/interfaces';
import GridSquareView from './gridSquareView';
import GridView from './gridView';

export default class ShipView implements IRenderable {
	shipRef: Ship;
	gridView: GridView;
	assetPath: string;
	sceneObject: Phaser.GameObjects.Image;
	owner: Player;
	dragging: boolean;
	dragStart: Vector2;
	originalRotation: Direction;
	shipLengthInPixels: number;
	repositioningShip: boolean;
	previousShipLocation: Coordinate;
	hasBeenPlaced: boolean;

	static currentFacingDirection: Direction = Direction.Right;
	static viewDepth = 2;

	constructor(owner: Player, ship: Ship, shipAsset: string) {
		this.owner = owner;
		this.shipRef = ship;
		this.assetPath = shipAsset;
		this.dragging = false;
		this.repositioningShip = false;
	}

	render(scene: Phaser.Scene, position: Vector2, scale: number): void {
		this.sceneObject = scene.add.image(position.x, position.y, this.assetPath).setScale(scale).setInteractive();
		this.sceneObject.setDepth(ShipView.viewDepth);
		scene.input.setDraggable(this.sceneObject);

		let bounds = this.sceneObject.getBounds();
		this.shipLengthInPixels = bounds.width;

		scene.input.keyboard.on('keydown-Q', () => {
			if (!this.dragging) return;
			this.rotateCounterClockwise();
			this.updateShipRotation();
			this.updateShipPosition(scene);
		});
		scene.input.keyboard.on('keydown-E', () => {
			if (!this.dragging) return;
			this.rotateClockwise();
			this.updateShipRotation();
			this.updateShipPosition(scene);
		});

		this.sceneObject.on('pointerdown', () => {
			this.dragStart = { x: this.sceneObject.x, y: this.sceneObject.y };
			this.originalRotation = ShipView.currentFacingDirection;
		});

		this.sceneObject.on('dragstart', () => {
			this.owner.selectShip(this.shipRef);
			if (this.hasBeenPlaced) {
				this.repositioningShip = true;
				this.removeFromGrid();
			}
			this.updateShipRotation();
		});

		this.sceneObject.on('drag', () => {
			this.dragging = true;
			this.updateShipPosition(scene);
		});

		this.sceneObject.on('dragend', (_, __, ___, droppedOnTarget) => {
			this.dragging = false;
			if (!droppedOnTarget) {
				this.resetShipToPreviousPosition();
				this.owner.deselectShip();
			}
		});

		this.sceneObject.on('drop', (_, target: Phaser.GameObjects.GameObject) => {
			const gridSquare = target.data.values as GridSquareView;
			if (!gridSquare.onDropShipOverSquare(this)) {
				this.resetShipToPreviousPosition(gridSquare);
			} else {
				this.previousShipLocation = gridSquare.coordinate;
			}
			this.owner.deselectShip();
		});
	}

	setNoLongerDraggable(): void {
		this.sceneObject.disableInteractive();
	}

	positionShipUnderMouse(mouseX: number, mouseY: number): Vector2 {
		const offset = this.shipLengthInPixels / 4;
		switch (ShipView.currentFacingDirection) {
			case Direction.Right:
				return { x: mouseX + offset, y: mouseY };
			case Direction.Left:
				return { x: mouseX - offset, y: mouseY };
			case Direction.Up:
				return { x: mouseX, y: mouseY - offset };
			case Direction.Down:
				return { x: mouseX, y: mouseY + offset };
		}
	}

	resetShipToPreviousPosition(gridSquare?: GridSquareView) {
		ShipView.currentFacingDirection = this.originalRotation;
		this.updateShipRotation();
		this.sceneObject.setPosition(this.dragStart.x, this.dragStart.y);

		if (gridSquare && this.previousShipLocation) {
			ShipView.currentFacingDirection = this.originalRotation;
			this.place(gridSquare.gridView, this.previousShipLocation);
			console.log('replaced ship:');
			console.log(gridSquare.gridView.gridRef.toString());
		}
	}

	rotateClockwise(): void {
		ShipView.currentFacingDirection = (ShipView.currentFacingDirection + 1) % 4;
	}

	rotateCounterClockwise(): void {
		if (ShipView.currentFacingDirection.valueOf() === 0) {
			ShipView.currentFacingDirection = 3;
		} else {
			ShipView.currentFacingDirection--;
		}
	}

	updateShipRotation(): void {
		switch (ShipView.currentFacingDirection) {
			case Direction.Right:
				this.sceneObject.angle = 0;
				break;
			case Direction.Up:
				this.sceneObject.angle = -90;
				break;
			case Direction.Left:
				this.sceneObject.angle = 180;
				break;
			case Direction.Down:
				this.sceneObject.angle = 90;
				break;
		}
	}

	updateShipPosition(scene: Phaser.Scene) {
		const mousePos = scene.input.mousePointer.position;
		const newPos = this.positionShipUnderMouse(mousePos.x, mousePos.y);
		this.sceneObject.setPosition(newPos.x, newPos.y);
	}

	place(grid: GridView, placeSpot: Coordinate): boolean {
		this.gridView = grid;

		if (!this._checkIfInBounds(placeSpot, ShipView.currentFacingDirection)) {
			console.log('Cannot place -- not in bounds!');
			return false;
		}
		if (!this._checkNotOverlappingExistingShips(placeSpot, ShipView.currentFacingDirection)) {
			console.log('Cannot place -- overlapping existing ship!');
			return false;
		}

		this._placeAllShipParts(placeSpot, ShipView.currentFacingDirection);
		this.hasBeenPlaced = true;
		return true;
	}

	removeFromGrid(): void {
		if (this.gridView == null) return;

		this.shipRef.coordinates.forEach((coordinate) => {
			this.gridView.gridRef.get(coordinate).removeShipPart();
		});

		this.hasBeenPlaced = false;
		this.shipRef.setCoordinates([]);
	}

	private _checkIfInBounds(startSpot: Coordinate, dir: Direction): boolean {
		// Subtracting length by 1 so the math is 0-based and will line
		// up with the rows and columns being 1-based
		let shipLength = this.shipRef.length - 1;
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
			if (this.gridView.gridRef.get(coord).hasShip) return false;
		}
		return true;
	}

	private _placeAllShipParts(startSpot: Coordinate, dir: Direction): void {
		let coords = this._getSpotsFor(startSpot, dir);
		this.shipRef.setCoordinates(coords);
		for (const coord of coords) {
			this.gridView.gridRef.get(coord).placeShipPart(this.shipRef);
		}
	}

	private _getSpotsFor(startSpot: Coordinate, dir: Direction): Coordinate[] {
		let spots: Coordinate[] = [];
		let shipLength = this.shipRef.length - 1;
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
