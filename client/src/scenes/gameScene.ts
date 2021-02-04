import Grid from '../../../shared/model/grid';
import Player from '../../../shared/model/Player';
import { Assets } from '../../../shared/utils/enums';
import { Socket } from 'socket.io-client';
import GridView from '../view/gridView';
import Game from '../../../shared/model/game';
import {
	ClickSquareArgs,
	CLICK_SQUARE,
	GAME_READY,
	GAME_STARTED,
	PLAYER_LEAVE,
	StartGameArgs,
	START_GAME,
	UpdateGameArgs,
	UPDATE_GAME,
} from '../../../shared/communications';
import { CanvasDimensions, GridImageDimensions } from '../../../shared/utils/constants';
import Coordinate from '../../../shared/model/coordinate';
import SetupScene from './setupScene';

export interface GameSceneArgs {
	localPlayerId: string;
	localGrid: Grid;
	socket: Socket;
	roomId: string;
	gameScale: number;
}

export default class GameScene extends Phaser.Scene {
	static key = 'BattleshipGame_Game';

	localGrid: GridView;
	opponentGrid: GridView;
	args: GameSceneArgs;
	socket: Socket;
	gameRef: Game;
	sceneObjects: {
		[key: string]: Phaser.GameObjects.GameObject;
	};

	private _hexBlack = 0x222222;
	private _labelFontColor = '#222222';
	private _accentFontColor = '#4effce';

	get localPlayerId(): string {
		return this.args?.localPlayerId;
	}
	get roomId(): string {
		return this.args?.roomId;
	}

	constructor() {
		super({
			key: GameScene.key,
		});
	}

	preload() {
		this.load.image(Assets.Grid, 'src/assets/10x10 Grid.png');
		this.load.image(Assets.Carrier, 'src/assets/Carrier.png');
		this.load.image(Assets.Battleship, 'src/assets/Battleship.png');
		this.load.image(Assets.Destroyer, 'src/assets/Cruiser or Destroyer.png');
		this.load.image(Assets.Submarine, 'src/assets/Submarine.png');
		this.load.image(Assets.Square, 'src/assets/BlankSquare.png');
		this.load.image(Assets.Mark, 'src/assets/Mark.png');

		this.sceneObjects = {};

		this.args = (this.scene?.settings?.data || {}) as GameSceneArgs;
		this.socket = this.args?.socket;
		if (this.socket) {
			this.socket.on(PLAYER_LEAVE, () => {
				console.log('A player left the game, returning to setup screen');
				this.scene.start(SetupScene.key);
			});
			this.socket.on(GAME_READY, () => {
				// might be a race condition here
				this.drawOrDestroyStartGameButton();
				this.drawOpponentGrid();
			});
			this.socket.on(GAME_STARTED, this._onGameUpdate.bind(this));
			this.socket.on(UPDATE_GAME, this._onGameUpdate.bind(this));
		} else {
			console.error('The scene was not provided with an active socket!');
		}
	}

	create() {
		this.drawTitleText('Room Id: ' + this.roomId);
		this.drawLocalPlayerGrid();
		this.drawOpponentGrid();
		this.drawOrDestroyStartGameButton();
	}

	drawTitleText(text: string) {
		if (!this.sceneObjects.headerText) {
			this.sceneObjects.headerText = this.add.text(CanvasDimensions.width / 4, 10, text, {
				color: this._labelFontColor,
				fixedWidth: CanvasDimensions.width / 2,
				align: 'center',
				fontSize: '40px',
			});
		} else {
			(this.sceneObjects.headerText as Phaser.GameObjects.Text).setText(text);
		}
	}

	drawLocalPlayerGrid() {
		if (!this.localGrid) {
			const padding = 16;
			const scale = this.args?.gameScale || 0.5;
			let scaledGridHeight = GridImageDimensions.height * scale;
			let scaledGridWidth = GridImageDimensions.width * scale;

			this.localGrid = new GridView(this.args?.localGrid, null, this._onGridClick.bind(this));
			this.localGrid.render(
				this,
				{ x: scaledGridWidth / 2, y: CanvasDimensions.height - scaledGridHeight / 2 - padding },
				scale
			);
		} else {
			this.localGrid.updateGridRef(this.gameRef.getGridFor(this.localPlayerId));
		}
		this.localGrid.setActive(false);
	}

	drawOpponentGrid() {
		if (!this.gameRef) return;
		if (!this.opponentGrid) {
			const padding = 16;
			const scale = this.args?.gameScale || 0.5;
			let scaledGridHeight = GridImageDimensions.height * scale;
			let scaledGridWidth = GridImageDimensions.width * scale;

			this.opponentGrid = new GridView(
				this.gameRef.getGridForOpponent(this.localPlayerId),
				null,
				this._onGridClick.bind(this)
			);
			this.opponentGrid.render(
				this,
				{
					x: CanvasDimensions.width - scaledGridWidth / 2 - padding,
					y: CanvasDimensions.height - scaledGridHeight / 2 - padding,
				},
				scale
			);
		} else {
			this.opponentGrid.updateGridRef(this.gameRef.getGridForOpponent(this.localPlayerId));
		}
		this.opponentGrid.setActive(true);
	}

	drawOrDestroyStartGameButton() {
		if (!this.sceneObjects.startGameButton && !this.gameRef?.started) {
			this.sceneObjects.startGameButton = this.add
				.text(0, 0, 'Start Game!', {
					color: this._labelFontColor,
					fontSize: '35px',
				})
				.setInteractive()
				.on('pointerover', () => {
					(this.sceneObjects.startGameButton as Phaser.GameObjects.Text).setColor(this._accentFontColor);
				})
				.on('pointerout', () => {
					(this.sceneObjects.startGameButton as Phaser.GameObjects.Text).setColor(this._labelFontColor);
				})
				.on('pointerdown', () => {
					this.socket.emit(START_GAME, { roomId: this.roomId } as StartGameArgs);
				});
		} else if (this.gameRef?.started && this.sceneObjects.startGameButton) {
			this.sceneObjects.startGameButton.destroy();
			delete this.sceneObjects.startGameButton;
		}
	}

	private _onGridClick(grid: Grid, coordinate: Coordinate) {
		this.socket?.emit(CLICK_SQUARE, {
			coordinate,
			roomId: this.roomId,
			guessedGridId: grid.id,
			sendingPlayerId: this.localPlayerId,
		} as ClickSquareArgs);
	}

	private _onGameUpdate(args: UpdateGameArgs) {
		this.gameRef = Game.fromJson(args.game);
		console.log('update: ', this.gameRef);

		if (this.gameRef.started) {
			if (this.gameRef.isPlayerTurn(this.localPlayerId)) {
				this.drawTitleText(`Your turn!`);
			} else {
				this.drawTitleText(`${this.gameRef.currentPlayer.name}'s turn`);
			}
			this.drawLocalPlayerGrid();
			this.drawOpponentGrid();
		} else {
			this.drawTitleText('Room Id: ' + this.args.roomId);
		}

		this.drawOrDestroyStartGameButton();
	}
}
