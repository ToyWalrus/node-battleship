import Coordinate from '../../../shared/model/coordinate';
import { GridSquareDimensions } from '../../../shared/utils/constants';
import { Assets } from '../../../shared/utils/enums';
import { IRenderable, Vector2 } from '../../../shared/utils/interfaces';
import GridView from './gridView';
import ShipView from './shipView';

export default class GridSquareView implements IRenderable {
	coordinate: Coordinate;
	gridView: GridView;
	isActive: boolean;
	sceneObject: Phaser.GameObjects.Image;
	bounds: Phaser.Geom.Rectangle;

	static viewDepth = 1;

	constructor(coordinate: Coordinate, grid: GridView) {
		this.coordinate = coordinate;
		this.gridView = grid;
		this.isActive = true;
	}

	setGrid(grid: GridView) {
		this.gridView = grid;
	}

	render(scene: Phaser.Scene, squareCenter: Vector2, scale: number): void {
		this.sceneObject = scene.add
			.image(squareCenter.x, squareCenter.y, Assets.Square)
			.setScale(scale)
			.setDepth(GridSquareView.viewDepth)
			.setInteractive();

		scene.add
			.zone(
				squareCenter.x,
				squareCenter.y,
				GridSquareDimensions.width * scale,
				GridSquareDimensions.height * scale
			)
			.setRectangleDropZone(GridSquareDimensions.width * scale, GridSquareDimensions.height * scale)
			.setData(this)
			.setInteractive();

		this.sceneObject.on('pointerover', () => {
			if (this.isActive) {
				this.tintSquare();
			}
		});

		this.sceneObject.on('pointerout', () => {
			this.clearTint();
		});

		this.sceneObject.on('pointerdown', () => {
			if (this.isActive) {
				this.gridView.onGridSquareClicked(this.coordinate);
			}
		});

		this.bounds = this.sceneObject.getBounds();
	}

	setActive(active: boolean): void {
		this.isActive = active;
		if (active) {
			this.sceneObject?.setInteractive();
		} else {
			this.sceneObject?.disableInteractive();
			this.sceneObject?.clearTint();
		}
	}

	tintSquare(color = 0xc2c2c2): void {
		this.sceneObject?.setTint(color);
	}

	clearTint(): void {
		this.sceneObject?.clearTint();
	}

	onPointerDown(): void {
		if (this.isActive) {
			this.gridView.onGridSquareClicked(this.coordinate);
		}
	}

	onPointerMove(x: number, y: number): boolean {
		if (this.isActive && this.bounds.contains(x, y)) {
			return true;
		}
		return false;
	}

	onDropShipOverSquare(ship: ShipView): boolean {
		if (!this.isActive) return false;
		return this.gridView.onShipPlaced(ship, this.coordinate);
	}
}
