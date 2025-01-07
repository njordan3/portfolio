import { GameController } from "./game-controller";
import { SingleplayerGame } from "./singleplayer-game";

export class Stack {
    up = [];
    down = [];
    _position = { x: 0, y: 0 };
    _width = 0;
    _height = 0;

    // Background render box
    #box = { x: 0, y: 0, width: 0, height: 0 };

    constructor(x, y, width, height) {
        // Prevents infinite singleplayer initialization
        const { cardMargin } = GameController.isMultiplayer()
            ? GameController.getGame().getDimensions()
            : SingleplayerGame.dimensions;

        this._position = { x, y };
        this._width = width;
        this._height = height;

        x -= cardMargin;
        y -= cardMargin;
        width += (2*cardMargin);
        height += (2*cardMargin);
        this.#box = { x, y, width, height };
    }

    get position() {
        return this._position;
    }

    push(card, index = 'down') {
        // We don't want reference to stack position object        
        card.position = {
            x: this._position.x,
            y: this._position.y
        };

        this[index].push(card);
    }

    flip() {
        const card = this.down.pop();
        if (card) {
            this.push(card, 'up');
        }
    }

    top(index = 'down') {
        const lastIndex = this[index].length - 1;
        if (lastIndex >= 0) {
            return this[index][lastIndex];
        }

        return null;
    }

    reset() {}

    renderBackground(context) {
        const { x, y, width, height } = this.#box;
        context.strokeStyle = 'gold';
        context.strokeRect(x, y, width, height);
    }

    isValidDrop() {
        return false;
    }

    isPointIntersected(x, y) {
        const { position } = this,
            width = this._width,
            height = this._height;
        
        return (
            x >= position.x && x <= position.x + width &&
            y >= position.y && y <= position.y + height
        );
    }

    toJSON() {
        const up = [];
        for (let i = 0; i < this.up.length; i++) {
            up.push(this.up[i].toJSON());
        }

        const down = [];
        for (let i = 0; i < this.down.length; i++) {
            down.push(this.down[i].toJSON());
        }

        return {
            up,
            down,
        };
    }
}