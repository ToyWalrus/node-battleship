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
	StartGameArgs,
	START_GAME,
	UpdateGameArgs,
	UPDATE_GAME,
} from '../../../shared/communication-methods';
import { CanvasDimensions, GridImageDimensions } from '../../../shared/utils/constants';
import Coordinate from '../../../shared/model/coordinate';

export interface GameSceneArgs {
	localPlayer: Player;
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
	gameReady: boolean;
	sceneObjects: {
		[key: string]: Phaser.GameObjects.GameObject;
	};

	private _hexBlack = 0x222222;
	private _labelFontColor = '#222222';
	private _accentFontColor = '#4effce';

	get localPlayer(): Player {
		return this.args?.localPlayer;
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
		this.gameReady = false;

		this.sceneObjects = {};

		this.args = (this.scene?.settings?.data || {}) as GameSceneArgs;
		this.socket = this.args?.socket;
		if (this.socket) {
			this.socket.on(GAME_READY, () => {
				// might be a race condition here
				this.gameReady = true;
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

			this.localGrid = new GridView(this.args?.localGrid, this.localPlayer, this._onGridClick.bind(this));
			this.localGrid.render(
				this,
				{ x: scaledGridWidth / 2, y: CanvasDimensions.height - scaledGridHeight / 2 - padding },
				scale
			);
		} else {
			console.log('local player: ', this.localPlayer);
			this.localGrid.updateGridRef(this.gameRef.getGridFor(this.localPlayer));
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
				this.gameRef.getGridForOpponent(this.localPlayer),
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
			this.opponentGrid.updateGridRef(this.gameRef.getGridForOpponent(this.localPlayer));
		}
		this.opponentGrid.setActive(true);
	}

	drawOrDestroyStartGameButton() {
		if (!this.sceneObjects.startGameButton && this.gameReady && !this.gameRef?.started) {
			this.sceneObjects.startGameButton = this.add
				.text(0, 0, 'Start Game!', {
					color: '#4effce',
					fontSize: '35px',
				})
				.setInteractive()
				.on('pointerover', () => {
					(this.sceneObjects.startGameButton as Phaser.GameObjects.Text).setColor('#888888');
				})
				.on('pointerout', () => {
					(this.sceneObjects.startGameButton as Phaser.GameObjects.Text).setColor('#4effce');
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
			grid,
			coordinate,
			roomId: this.roomId,
			sendingPlayer: this.localPlayer,
		} as ClickSquareArgs);
	}

	private _onGameUpdate(args: UpdateGameArgs) {
		this.gameRef = Game.fromJson(args.game);
		console.log('update: ', args.game);
		console.log(this.gameRef);

		if (this.gameRef.started) {
			if (this.gameRef.isPlayerTurn(this.localPlayer)) {
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
