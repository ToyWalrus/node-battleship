export interface IRenderable {
	render(scene: Phaser.Scene, position: Vector2, scale: number): void;
}

export interface Dimensions {
	height: number;
	width: number;
}

export interface Vector2 {
	x: number;
	y: number;
}
