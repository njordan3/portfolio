import { generateRandomInt } from '@/utils/misc';
import { Mouse } from './mouse';
import Camera from './camera';
import cardSpriteSheet from '@images/decksprite.png';
import { getImage } from '@/utils/images';
import { useRef } from 'react';

// Order matches the spritesheet
const Suits = Object.freeze({
    HEARTS: 0,
    DIAMONDS: 1,
    CLUBS: 2,
    SPADES: 3
});

const Ranks = Object.freeze({
    TWO: 0,
    THREE: 1,
    FOUR: 2,
    FIVE: 3,
    SIX: 4,
    SEVEN: 5,
    EIGHT: 6,
    NINE: 7,
    TEN: 8,
    JACK: 9,
    QUEEN: 10,
    KING: 11,
    ACE: 12,
});

class Card {
    #position = { x: 0, y: 0 };
    suit;
    rank;

    // Used to make sure this card gets rendered last so it shows on top
    isDragging = false;

    hitbox;
    context;

    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    set position(position) {
        this.#position = position;
        const hitbox = new Path2D();
        hitbox.rect(position.x, position.y, this.context.canvas.width, this.context.canvas.height);
        this.hitbox = hitbox;
    }

    get position() {
        return this.#position;
    }
}

export class Game {
    tableau;        // 7 piles that make up the main table
    foundations;    // 4 piles that build on the 4 aces
    hand;           // Cards in hand

    camera;
    mouse;

    cardBackImage;

    dimensions = {
        boardWidth: 2000,
        boardHeight: 1000,
        cardWidth: 81,
        cardHeight: 117,
        cardGap: 20,
        cardMargin: 5,
        cardYOffset: 0,
        centerX: 0,
        centerY: 0,
        tableauX: 0,
        tableauY: 0,
        handDownX: 0,
        handDownY: 0,
        handUpX: 0,
        handUpY: 0,
        foundationX: 0,
        foundationY: 0,
    };

    #draggingCardIndex = null;
    #draggingCardOffset = null;
    #cardSpriteSheet;

    constructor() {
        // Calculate dimensions/positions of our stacks. These will never change during a game.
        const dimensions = this.dimensions;

        dimensions.cardYOffset = Math.round(dimensions.cardHeight/3);

        dimensions.centerX = dimensions.boardWidth/2;
        dimensions.centerY = dimensions.boardHeight/2;

        dimensions.tableauX = dimensions.centerX - (dimensions.cardWidth * 3.5) - (dimensions.cardGap * 3);
        dimensions.tableauY = dimensions.centerY - (dimensions.cardHeight/2);

        dimensions.handDownX = dimensions.tableauX;
        dimensions.handDownY = dimensions.tableauY + dimensions.cardHeight + dimensions.cardGap;

        dimensions.handUpX = dimensions.handDownX + dimensions.cardWidth + dimensions.cardGap;
        dimensions.handUpY = dimensions.handDownY;

        dimensions.foundationX = dimensions.centerX - (dimensions.cardWidth * 2) - (dimensions.cardGap * 1.5);
        dimensions.foundationY = dimensions.tableauY - dimensions.cardHeight - dimensions.cardGap;

        this.dimensions = Object.freeze(dimensions);

        this.mouse = new Mouse();
        this.camera = new Camera();

        this.#cardSpriteSheet = getImage(cardSpriteSheet).value; // Assumes it's already downloaded
        const { cardWidth, cardHeight } = this.dimensions;

        const canvas = new OffscreenCanvas(cardWidth, cardHeight);
        const context = canvas.getContext('2d', { alpha: false });
        context.drawImage(
            this.#cardSpriteSheet,
            0, 4 * cardHeight,
            cardWidth, cardHeight,
            0, 0,
            cardWidth, cardHeight,
        );
        context.save();

        this.cardBackImage = canvas;
    }

    reset() {
        this.hand = new Stack({ x: this.dimensions.handDownX, y: this.dimensions.handDownY });
        
        const { cardWidth, cardHeight } = this.dimensions;

        for (let i = 0; i < 52; i++) {
            const rank = i % 13;
            const suit = i % 4;
            const card = new Card(suit, rank);

            const canvas = new OffscreenCanvas(cardWidth, cardHeight);
            const context = canvas.getContext('2d', { alpha: false });
            context.drawImage(
                this.#cardSpriteSheet,
                rank * cardWidth, suit * cardHeight,
                cardWidth, cardHeight,
                0, 0,
                cardWidth, cardHeight,
            );
            context.save();

            card.context = context;

            this.hand.push(card);
        }

        this.tableau = Array.from({ length: 7 }, (e, i) => {
            const x = this.dimensions.tableauX + ((this.dimensions.cardWidth + this.dimensions.cardGap) * i);
            const y = this.dimensions.tableauY;

            return new Stack({ x, y }, this.dimensions.cardYOffset);
        });
        this.foundations = Array.from({ length: 4 }, (e, i) => {
            const x = this.dimensions.foundationX + ((this.dimensions.cardWidth + this.dimensions.cardGap) * i);
            const y = this.dimensions.foundationY;

            return new Stack({ x, y });
        });
    }

    deal() {
        this.reset();

        // Shuffle (Fisher-Yates) hand before dealing
        for (let i = this.hand.down.length-1; i > 0; i--) {
            const random = generateRandomInt(0, i);
            const swap = this.hand.down[random];
            this.hand.down[random] = this.hand.down[i];
            this.hand.down[i] = swap;
        }

        // The deal
        for (let i = 0; i < this.tableau.length; i++) {
            for (let j = i; j < this.tableau.length; j++) {
                this.tableau[j].push( this.hand.down.pop() );
            }
        }

        for (let i = 0; i < this.tableau.length; i++) {
            this.tableau[i].flip();
        }
    }

    /**
     * Find and set the dragging card. Does nothing if no card is found.
     * @see #draggingCardOffset x and y offset from the top-left corner of the card to the incoming coordinates
     * @see #draggingCardIndex list of indexes that lead to where the card is located
     * @param {number} x Board X coordinate.
     * @param {number} y Board Y coordinate.
     * @returns {void}
     */
    #setDraggingCardIndex(x, y) {
        for (let i = 0; i < this.hand.up.length; i++) {
            const { hitbox, context, position } = this.hand.up[i];
            if ( context.isPointInPath(hitbox, x, y) ) {
                this.hand.up[i].isDragging = true;
                this.#draggingCardOffset = {
                    x: x - position.x,
                    y: y - position.y
                };
                this.#draggingCardIndex = ['hand', 'up', i];
                return;
            }
        }

        for (let i = 0; i < this.tableau.length; i++) {
            for (let j = 0; j < this.tableau[i].up.length; j++) {
                const { hitbox, context, position } = this.tableau[i].up[j];
                if ( context.isPointInPath(hitbox, x, y) ) {
                    this.tableau[i].up[j].isDragging = true;
                    this.#draggingCardOffset = {
                        x: x - position.x,
                        y: y - position.y
                    };
                    this.#draggingCardIndex = ['tableau', i, 'up', j];
                    return;
                }
            }
        }
    }

    #getDraggingCard() {
        if (this.#draggingCardIndex !== null) {
            let card = this[this.#draggingCardIndex[0]];
            for (let i = 1; i < this.#draggingCardIndex.length; i++) {
                card = card[this.#draggingCardIndex[i]];
            }

            return card;
        }

        return null;
    }

    mouseEvent(e) {
        if (e.type === 'mousedown') {
            this.mouse.button = true;
        }
        if (e.type === 'mouseup' || e.type === 'mouseout') {
            this.mouse.button = false;
            
            const card = this.#getDraggingCard();
            if (card) {
                card.isDragging = false;
            }
            this.#draggingCardIndex = null;
            this.#draggingCardOffset = null;
        }
        this.mouse.position = {
            x: e.clientX - e.target.offsetLeft,
            y: e.clientY - e.target.offsetTop
        };
    
        if (this.mouse.button) {
            if (e.type === 'mousedown') {
                const { x, y } = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);
                this.#setDraggingCardIndex(x, y);
            } else if (e.type === 'mousemove') {
                if (this.#draggingCardIndex !== null) {
                    const card = this.#getDraggingCard();
                    
                    const newPosition = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);
                    newPosition.x -= this.#draggingCardOffset.x;
                    newPosition.y -= this.#draggingCardOffset.y;

                    // Takes advantage of class instance reference to set position of nested value
                    card.position = newPosition;
                    this.camera.forceUpdate();
                } else {
                    const x = this.mouse.position.x - this.mouse.oldPosition.x;
                    const y = this.mouse.position.y - this.mouse.oldPosition.y;
                    this.camera.pan({ x, y });
                }
            }

            // check x and y seperately so the window doesnt get stuck
            // if (checkWindowXCollision(bg_coords, translation)) {
            //     camera.current.x += moveStart.current.x - x;
            // }
            // if (checkWindowYCollision(bg_coords, translation)) {
            //     camera.current.y += moveStart.current.y - y;
            // }
        }
    }

    scrollEvent(e) {
        this.camera.scaleAt({ x: e.clientX, y: e.clientY }, e.deltaY);
    }
}

export function useGame() {
    const game = useRef(new Game());

    return { game: game.current };
}

class Stack {
    up = [];
    down = [];

    #position = { x: 0, y: 0 };
    #cardYOffset = 0

    constructor(position = { x: 0, y: 0}, cardYOffset = 0) {
        this.#position = position;
        this.#cardYOffset = cardYOffset;
    }

    get position() {
        return this.#position;
    }

    push(card, index = 'down') {
        // We don't want reference to stack position
        const position = {
            x: this.#position.x,
            y: this.#position.y
        };

        if (index === 'up') {
            const topCard = this.top('up');

            if (topCard) {
                position.y = topCard.position.y + this.#cardYOffset;
            }
        }
        
        card.position = position;

        this[index].push(card);
    }

    pop(index = 'down') {
        return this[index].pop();
    }

    flip() {
        const card = this.pop();
        this.push(card, 'up');
    }

    top(index = 'down') {
        const lastIndex = this[index].length - 1;
        if (lastIndex >= 0) {
            return this[index][lastIndex];
        }

        return null;
    }
}