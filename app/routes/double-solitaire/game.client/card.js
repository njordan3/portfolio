export default class Card {
    #position = { x: 0, y: 0 };
    suit;
    rank;

    // Used to make sure this card gets rendered last so it shows on top
    isDragging = false;

    context;

    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    set position(position) {
        this.#position = position;
    }

    get position() {
        return this.#position;
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
}