import { Card } from "./card";

export class Stack {
    static margin = 0;

    up = [];
    down = [];
    originalPosition = { x: 0, y: 0 };  // Store original position for resets
    _position = { x: 0, y: 0 };
    get position() {
        return this._position;
    }
    _width = 0;
    _height = 0;
    _playerType;

    highlightDownEmpty = false;
    highlightIndex = null;
    
    // Background render box
    #box;

    constructor(x, y, width, height, playerType = null) {
        this._playerType = playerType;
        this.originalPosition = { x, y };
        this._position = { x, y };
        this._width = width;
        this._height = height;
    }

    push(card, index = 'down') {
        // We don't want reference to stack position object        
        card.position = { ...this._position };

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

    reset() {
        this.highlightIndex = null;
    }

    renderForeground(context) {
        if (this.highlightDownEmpty) {
            context.fillStyle = 'rgb(98 196 255 / 50%)';
            context.fillRect(this.position.x - Card.highlightWidth, this.position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), Card.height + (Card.highlightWidth * 2));
        }
        
        const topCard = this.top('up');
        if (topCard) {
            if (this.highlightIndex !== null) {
                context.fillStyle = 'rgb(98 196 255 / 50%)';
                context.fillRect(topCard.position.x - Card.highlightWidth, topCard.position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), Card.height + (Card.highlightWidth * 2));
            }

            topCard.draw(context);
        }
    }

    renderBackground(context) {
        const { x, y } = this.originalPosition;
        if (!this.#box) {
            this.#box = {
                x: x - Stack.margin,
                y: y - Stack.margin,
                width: Card.width + (2*Stack.margin),
                height: Card.height + (2*Stack.margin)
            };
        }
        context.strokeStyle = 'rgb(255 215 0 / 50%)';
        context.lineWidth = 3;
        context.strokeRect(this.#box.x, this.#box.y, this.#box.width, this.#box.height);
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