export class Stack {
    up = [];
    down = [];
    _originalPosition = { x: 0, y: 0 }; // Store original position for resets
    _position = { x: 0, y: 0 };
    get position() {
        return this._position;
    }
    _width = 0;
    _height = 0;
    _playerType;

    constructor(x, y, width, height, playerType) {
        this._playerType = playerType;
        this._originalPosition = { x, y };
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

    reset() {}

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
            position: this._position,
            originalPosition: this._originalPosition,
            width: this._width,
            height: this._height,
            playerType: this._playerType,
        };
    }
}