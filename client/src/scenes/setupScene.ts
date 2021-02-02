import Game from '../model/game';
import Grid from '../model/grid';
import Player from '../model/Player';
import Ship from '../model/ship';
import { CanvasDimensions, GridImageDimensions, PluginKeys } from '../utils/constants';
import { Assets, GamePhase } from '../utils/enums';
import { Vector2 } from '../utils/interfaces';
import GridView from '../view/gridView';
import ShipView from '../view/shipView';
import { io, Socket } from 'socket.io-client';

export default class SetupScene extends Phaser.Scene {
	battleshipGame: Game;
	localPlayer: Player;
	playerGrid: Grid;
	playerShips: Ship[];
	socket: Socket;

	private _hexBlack = 0x222222;
	private _labelFontColor = '#222222';
	private _accentFontColor = '#4effce';

	constructor() {
		super({
			key: 'BattleshipGame_Setup',
		});
	}

	preload() {
		this.load.image(Assets.Grid, 'src/assets/10x10 Grid.png');
		this.load.image(Assets.Carrier, 'src/assets/Carrier.png');
		this.load.image(Assets.Battleship, 'src/assets/Battleship.png');
		this.load.image(Assets.Destroyer, 'src/assets/Cruiser or Destroyer.png');
		this.load.image(Assets.Submarine, 'src/assets/Submarine.png');
		this.load.image(Assets.Square, 'src/assets/BlankSquare.png');

		this.playerShips = [
			new Ship({ length: 2 }),
			new Ship({ length: 3 }),
			new Ship({ length: 3 }),
			new Ship({ length: 4 }),
			new Ship({ length: 5 }),
		];
		this.playerGrid = new Grid();
		this.localPlayer = new Player({ ships: this.playerShips });
	}

	create() {
		const scale = 0.5;

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
		this.drawJoinButton(
			new Phaser.Geom.Rectangle(
				CanvasDimensions.width - CanvasDimensions.width / 4,
				CanvasDimensions.height / 2,
				200,
				50
			)
		);

		this.setupSocketIO();
	}

	setupSocketIO() {
		this.socket = io('http://localhost:3000');
		this.socket.on('connect', () => {
			console.log('Connected!');
		});
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
		const totalAreaHeight = shipPositionalGap * this.playerShips.length + labelFontSize + labelYOffset;

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

		for (let i = 0; i < this.playerShips.length; ++i) {
			const ship = this.playerShips[i];
			const shipView = new ShipView(this.localPlayer, ship, this._getShipAsset(ship));
			const positionY = shipsPosition.y + shipPositionalGap * (i + 1);
			shipView.render(this, { x: shipsPosition.x, y: positionY }, scale);
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

		buttonRect.on('pointerdown', () => {
			if (!this._canJoinGame) return;
			console.log('join game!');
		});
	}

	drawPlayerNameInputField(labelPosition: Vector2) {
		this.add.text(labelPosition.x, labelPosition.y, 'Player Name', {
			color: this._labelFontColor,
			fontSize: '22px',
			fontStyle: 'bold',
		});

		let playerNameInput = this.add
			.text(labelPosition.x, labelPosition.y + 30, '', {
				fixedWidth: 200,
				fixedHeight: 30,
				color: this._accentFontColor,
				backgroundColor: this._labelFontColor,
			})
			.setInteractive();

		playerNameInput.on('pointerdown', () => {
			this[PluginKeys.RexUI].edit(playerNameInput);
		});
	}

	private _getShipAsset(ship: Ship): string {
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
		return this.localPlayer.name !== null && this.localPlayer.name !== '' && this.localPlayer.allShipsArePlaced();
	}
}
