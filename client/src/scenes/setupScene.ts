import { JoinGameArgs, JOIN_GAME, ServerInfo } from '../../../shared/communications';
import Game from '../../../shared/model/game';
import Grid from '../../../shared/model/grid';
import Player from '../../../shared/model/Player';
import Ship from '../../../shared/model/ship';
import { CanvasDimensions, PluginKeys } from '../../../shared/utils/constants';
import { Assets } from '../../../shared/utils/enums';
import { Vector2 } from '../../../shared/utils/interfaces';
import GridView from '../view/gridView';
import ShipView from '../view/shipView';
import { io, Socket } from 'socket.io-client';
import { GameSceneArgs } from './gameScene';

export default class SetupScene extends Phaser.Scene {
	static key = 'BattleshipGame_Setup';

	battleshipGame: Game;
	localPlayer: Player;
	playerGrid: Grid;
	playerShips: ShipView[];
	playerShipRefs: Ship[];
	socket: Socket;
	playerNameInput: Phaser.GameObjects.Text;
	roomIdInput: Phaser.GameObjects.Text;
	gameScale: number;

	private _hexBlack = 0x222222;
	private _labelFontColor = '#222222';
	private _accentFontColor = '#4effce';

	constructor() {
		super({
			key: SetupScene.key,
		});
	}

	preload() {
		this.load.image(Assets.Grid, 'src/assets/10x10 Grid.png');
		this.load.image(Assets.Carrier, 'src/assets/Carrier.png');
		this.load.image(Assets.Battleship, 'src/assets/Battleship.png');
		this.load.image(Assets.Destroyer, 'src/assets/Cruiser or Destroyer.png');
		this.load.image(Assets.Submarine, 'src/assets/Submarine.png');
		this.load.image(Assets.Square, 'src/assets/BlankSquare.png');

		this.playerShips = [];
		this.playerShipRefs = [
			new Ship({ length: 2 }),
			new Ship({ length: 3 }),
			new Ship({ length: 3 }),
			new Ship({ length: 4 }),
			new Ship({ length: 5 }),
		];
		this.playerGrid = new Grid();
		this.localPlayer = new Player({ ships: this.playerShipRefs });

		this.gameScale = 0.5;
	}

	create() {
		const scale = this.gameScale;
		this.socket = io(ServerInfo.hostname + ':' + ServerInfo.port);

		const headerText = 'Place Your Ships!';
		this.drawHeaderText(headerText, { x: CanvasDimensions.width / 2 - (headerText.length / 4) * 40, y: 10 });
		this.drawPlayerGrid({ x: CanvasDimensions.width / 4.5, y: CanvasDimensions.height / 2 - 10 }, scale);
		this.drawShips(
			{
				x: CanvasDimensions.width - CanvasDimensions.width / 2.5,
				y: CanvasDimensions.height / 4,
			},
			scale
		);
		this.drawPlayerNameInputField({
			x: CanvasDimensions.width - CanvasDimensions.width / 4,
			y: CanvasDimensions.height / 4,
		});
		this.drawRoomIdInputField({
			x: CanvasDimensions.width - CanvasDimensions.width / 4,
			y: (CanvasDimensions.height * 1.5) / 4,
		});
		this.drawJoinButton(
			new Phaser.Geom.Rectangle(
				CanvasDimensions.width - CanvasDimensions.width / 4,
				CanvasDimensions.height / 2,
				200,
				50
			)
		);
	}

	drawHeaderText(text: string, position: Vector2) {
		this.add.text(position.x, position.y, text, {
			color: this._labelFontColor,
			fontSize: '40px',
			fontStyle: 'bold',
		});
	}

	drawPlayerGrid(gridPosition: Vector2, scale: number) {
		let gridView = new GridView(this.playerGrid, this.localPlayer);
		gridView.render(this, gridPosition, scale);
	}

	drawShips(shipsPosition: Vector2, scale: number) {
		const labelWidth = 275;
		const labelFontSize = 16;
		const labelYOffset = 10;
		const containerPadding = 50;
		const shipPositionalGap = 100 * scale + (100 * scale) / 10;
		const totalAreaHeight = shipPositionalGap * this.playerShipRefs.length + labelFontSize + labelYOffset;

		let shipsContainer = this.add.rectangle(
			shipsPosition.x,
			shipsPosition.y + totalAreaHeight / 2,
			labelWidth + containerPadding,
			totalAreaHeight + containerPadding
		);
		shipsContainer.isFilled = false;
		shipsContainer.isStroked = true;
		shipsContainer.setStrokeStyle(4, this._hexBlack);

		this.add.text(
			shipsPosition.x - labelWidth / 2,
			shipsPosition.y - labelYOffset,
			'Drag and Drop Ships to Board',
			{
				color: this._labelFontColor,
				fontStyle: 'italic',
				fontSize: `${labelFontSize}px`,
				fixedWidth: labelWidth,
			}
		);

		for (let i = 0; i < this.playerShipRefs.length; ++i) {
			const ship = this.playerShipRefs[i];
			const shipView = new ShipView(this.localPlayer, ship, SetupScene.getShipAsset(ship));
			const positionY = shipsPosition.y + shipPositionalGap * (i + 1);
			shipView.render(this, { x: shipsPosition.x, y: positionY }, scale);
			this.playerShips.push(shipView);
		}
	}

	drawJoinButton(buttonDimensions: Phaser.Geom.Rectangle) {
		let button = this.add.rectangle(
			buttonDimensions.centerX,
			buttonDimensions.centerY,
			buttonDimensions.width,
			buttonDimensions.height,
			this._hexBlack
		);
		let buttonText = this.add.text(
			buttonDimensions.centerX - buttonDimensions.width / 4,
			buttonDimensions.centerY - buttonDimensions.height / 5,
			'Join Game',
			{
				fixedWidth: buttonDimensions.width,
				fixedHeight: buttonDimensions.height,
				color: this._accentFontColor,
				fontSize: '20px',
				fontStyle: 'bold',
			}
		);
		let buttonRect = this.add
			.zone(buttonDimensions.centerX, buttonDimensions.centerY, buttonDimensions.width, buttonDimensions.height)
			.setInteractive();

		buttonRect.on('pointerover', () => {
			if (!this._canJoinGame) return;
			button.fillColor = 0x555555;
			buttonText.setColor('#4eceff');
		});

		buttonRect.on('pointerout', () => {
			button.fillColor = this._hexBlack;
			buttonText.setColor(this._accentFontColor);
		});

		buttonRect.on('pointerdown', this._joinGame.bind(this));
	}

	drawPlayerNameInputField(labelPosition: Vector2) {
		this.add.text(labelPosition.x, labelPosition.y, 'Player Name', {
			color: this._labelFontColor,
			fontSize: '22px',
			fontStyle: 'bold',
		});

		this.playerNameInput = this.add
			.text(labelPosition.x, labelPosition.y + 30, 'Player', {
				fixedWidth: 200,
				fixedHeight: 30,
				color: this._accentFontColor,
				backgroundColor: this._labelFontColor,
			})
			.setInteractive();

		this.playerNameInput.on('pointerdown', () => {
			this[PluginKeys.RexUI].edit(this.playerNameInput);
		});
	}

	drawRoomIdInputField(position: Vector2) {
		this.add.text(position.x, position.y, 'Room Id', {
			color: this._labelFontColor,
			fontSize: '22px',
			fontStyle: 'bold',
		});

		this.roomIdInput = this.add
			.text(position.x, position.y + 30, 'game', {
				fixedWidth: 200,
				fixedHeight: 30,
				color: this._accentFontColor,
				backgroundColor: this._labelFontColor,
			})
			.setInteractive();

		this.roomIdInput.on('pointerdown', () => {
			this[PluginKeys.RexUI].edit(this.roomIdInput);
		});
	}

	private _joinGame(): void {
		if (!this._canJoinGame) return;
		this.socket.emit(
			JOIN_GAME,
			{
				player: this.localPlayer,
				grid: this.playerGrid,
				roomId: this.roomIdInput.text,
			} as JoinGameArgs,
			(wasAcceptedIntoGame: boolean) => {
				if (wasAcceptedIntoGame) {
					this.scene.start('BattleshipGame_Game', {
						localPlayer: this.localPlayer,
						localGrid: this.playerGrid,
						socket: this.socket,
						roomId: this.roomIdInput.text,
						gameScale: this.gameScale,
					} as GameSceneArgs);
				} else {
					console.warn('The server did not allow you into the game');
				}
			}
		);
	}

	public static getShipAsset(ship: Ship): string {
		switch (ship.length) {
			case 2:
				return Assets.Submarine;
			case 3:
				return Assets.Destroyer;
			case 4:
				return Assets.Battleship;
			case 5:
				return Assets.Carrier;
			default:
				return '';
		}
	}

	private get _canJoinGame() {
		this.localPlayer.setName(this.playerNameInput.text);
		return (
			this.localPlayer.name !== null &&
			this.localPlayer.name !== '' &&
			this.playerShips.every((s) => s.hasBeenPlaced) &&
			this.roomIdInput.text !== null &&
			this.roomIdInput.text !== ''
		);
	}
}
