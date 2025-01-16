import { Game } from "./internal";

export class Card {
    static width;
    static height;

    static highlightWidth = 3;
    
    position = { x: 0, y: 0 };
    #yFlipped = false;
    get yFlipped() {
        return this.#yFlipped;
    }

    #suit;
    get suit() {
        return this.#suit;
    }
    #rank;
    get rank() {
        return this.#rank;
    }

    // Used to make sure this card gets rendered last so it shows on top
    isDragging = false;

    context;

    constructor(suit, rank, yFlipped = false) {
        this.#suit = suit;
        this.#rank = rank;
        this.#yFlipped = yFlipped;

        const index = this.#rank + (this.#suit * 13);
        this.context = this.#yFlipped ? Game.cardFrontImagesFlipped[index] : Game.cardFrontImages[index];
    }

    isPointIntersected(x, y) {
        const { position } = this,
            width = this.context.canvas.width,
            height = this.context.canvas.height;
        
        return (
            x >= position.x && x <= position.x + width &&
            y >= position.y && y <= position.y + height
        );
    }

    draw(context, opacity = 1) {
        context.globalAlpha = opacity;
        context.drawImage(this.context.canvas, this.position.x, this.position.y);
    }

    toJSON() {
        return {
            suit: this.#suit,
            rank: this.#rank,
            yFlipped: this.#yFlipped
        }
    }
}