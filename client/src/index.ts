import * as Phaser from 'phaser';
import GameScene from './scenes/gameScene';
import { CanvasDimensions } from './utils/constants';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: 'phaser-example',
	width: CanvasDimensions.width,
	height: CanvasDimensions.height,
	scene: [GameScene],
	backgroundColor: '#ffffff',
	canvasStyle: 'border: 1px solid black', // for development purposes
};

const game = new Phaser.Game(config);
