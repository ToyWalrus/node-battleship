import Game from '../model/game';
import Grid from '../model/grid';
import Player from '../model/Player';
import Ship from '../model/ship';
import { CanvasDimensions, GridImageDimensions } from '../utils/constants';
import { Assets, GamePhase } from '../utils/enums';
import GridView from '../view/gridView';
import ShipView from '../view/shipView';

export default class GameScene extends Phaser.Scene {
	battleshipGame: Game;

	constructor() {
		super({
			key: 'BattleshipGame',
		});
	}

	preload() {
		this.load.image(Assets.Grid, 'src/assets/10x10 Grid.png');
		this.load.image(Assets.Mark, 'src/assets/Mark.png');
		this.load.image(Assets.Carrier, 'src/assets/Carrier.png');
		this.load.image(Assets.Battleship, 'src/assets/Battleship.png');
		this.load.image(Assets.Cruiser, 'src/assets/Cruiser or Destroyer.png');
		this.load.image(Assets.Destroyer, 'src/assets/Cruiser or Destroyer.png');
		this.load.image(Assets.Submarine, 'src/assets/Submarine.png');
		this.load.image(Assets.Square, 'src/assets/BlankSquare.png');
	}

	create() {
		const scale = 0.5;

		this.battleshipGame = new Game();
		this.battleshipGame.manualUpdatePhase(GamePhase.Setup);
		let testPlayer = new Player({ name: 'test player' });

		let shipview = new ShipView(testPlayer, new Ship({ length: 3 }), Assets.Cruiser);
		shipview.render(this, { x: 900, y: 300 }, scale);

		let shipview2 = new ShipView(testPlayer, new Ship({ length: 2 }), Assets.Submarine);
		shipview2.render(this, { x: 900, y: 500 }, scale);

		let gridView = new GridView(new Grid(), this.battleshipGame, testPlayer);
		gridView.render(this, { x: 300, y: 300 }, scale);
	}

	spawnGrids() {
		const scale = 0.5;
		const padding = 16;
		let scaledGridHeight = GridImageDimensions.height * scale;
		let scaledGridWidth = GridImageDimensions.width * scale;

		let grid1XPosition = scaledGridWidth / 2; // grid 1 doesn't need X padding
		let grid2XPosition = CanvasDimensions.width - scaledGridWidth / 2 - padding;
		let gridYPosition = CanvasDimensions.height - scaledGridHeight / 2 - padding;

		this.add.image(grid1XPosition, gridYPosition, Assets.Grid).setScale(scale, scale);
		this.add.image(grid2XPosition, gridYPosition, Assets.Grid).setScale(scale, scale);
	}
}
