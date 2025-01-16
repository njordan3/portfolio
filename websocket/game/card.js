import { MultiplayerDimensions } from "./internal.js";

export class Card {
    static width;
    static height;

    position = { x: 0, y: 0 };
    #yFlipped = false;
    get yFlipped() {
        return this.#yFlipped;
    }
    
    // Used to make sure this card gets rendered last so it shows on top
    isDragging = false;

    #suit;
    get suit() {
        return this.#suit;
    }
    #rank;
    get rank() {
        return this.#rank;
    }

    constructor(suit, rank, yFlipped = false) {
        this.#suit = suit;
        this.#rank = rank;
        this.#yFlipped = yFlipped;
    }

    isPointIntersected(x, y) {
        const { position } = this;
        return (
            x >= position.x && x <= position.x + Card.width &&
            y >= position.y && y <= position.y + Card.height
        );
    }

    toJSON() {
        return {
            position: this.position,
            suit: this.#suit,
            rank: this.#rank,
            yFlipped: this.#yFlipped,
            isDragging: this.isDragging,
        }
    }
}

Card.width = MultiplayerDimensions.getInstance().cardWidth;
Card.height = MultiplayerDimensions.getInstance().cardHeight;