import { MultiplayerDimensions } from "./dimensions.js";

export default class Card {
    position = { x: 0, y: 0 };
    #yFlipped = false;

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
        const { cardWidth, cardHeight } = MultiplayerDimensions.getInstance();
        const { position } = this;
        
        return (
            x >= position.x && x <= position.x + cardWidth &&
            y >= position.y && y <= position.y + cardHeight
        );
    }

    toJSON() {
        return {
            position: this.position,
            suit: this.#suit,
            rank: this.#rank,
            yFlipped: this.#yFlipped,
        }
    }
}