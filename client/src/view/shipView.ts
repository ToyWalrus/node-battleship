import Game from '../model/game';
import Player from '../model/Player';
import Ship from '../model/ship';
import { GridSquareDimensions } from '../utils/constants';
import { Direction, GamePhase } from '../utils/enums';
import { Dimensions, IRenderable, Vector2 } from '../utils/interfaces';
import GridSquareView from './gridSquareView';

export default class ShipView implements IRenderable {
	shipRef: Ship;
	assetPath: string;
	sceneObject: Phaser.GameObjects.Image;
	owner: Player;
	dragging: boolean;
	dragStart: Vector2;
	originalRotation: Direction;
	shipLengthInPixels: number;

	static currentFacingDirection: Direction = Direction.Right;
	static viewDepth = 2;

	constructor(owner: Player, ship: Ship, shipAsset: string) {
		this.owner = owner;
		this.shipRef = ship;
		this.assetPath = shipAsset;
		this.dragging = false;
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
				this.resetShipToPreviousPosition();
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

	resetShipToPreviousPosition() {
		ShipView.currentFacingDirection = this.originalRotation;
		this.updateShipRotation();
		this.sceneObject.setPosition(this.dragStart.x, this.dragStart.y);
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
}
