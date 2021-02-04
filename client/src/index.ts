import * as Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import SetupScene from './scenes/setupScene';
import TestScene from './scenes/testScene';
import { CanvasDimensions, PluginKeys } from '../../shared/utils/constants';
import GameScene from './scenes/gameScene';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: 'phaser-example',
	dom: {
		createContainer: true,
	},
	width: CanvasDimensions.width,
	height: CanvasDimensions.height,
	plugins: {
		scene: [
			{
				key: PluginKeys.RexUI,
				plugin: RexUIPlugin,
				mapping: 'rexUI',
			},
		],
	},
	scene: [SetupScene, GameScene],
	backgroundColor: '#ffffff',
	canvasStyle: 'border: 1px solid black', // for development purposes
};

export default new Phaser.Game(config);
