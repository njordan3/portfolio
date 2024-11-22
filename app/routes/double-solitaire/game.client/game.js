import { generateRandomInt } from '@/utils/misc';
import { Mouse } from './mouse';
import Camera from './camera';
import cardSpriteSheet from '@images/decksprite.png';
import { getImage } from '@/utils/images';
import { useRef } from 'react';
import Hand from './hand';
import Tableau from './tableau';
import Foundations from './foundations';
import Card from './card';

/**
 * Singleton Game instance
 */
class Game {
    tableau;        // 7 piles that make up the main table
    foundations;    // 4 piles that build on the 4 aces
    hand;           // Cards in hand

    camera;
    mouse;

    cardBackImage;

    static #instance;

    dimensions = {
        boardWidth: 2000,
        boardHeight: 1000,
        cardWidth: 81,
        cardHeight: 117,
        cardGap: 20,
        cardMargin: 5,
        cardXOffset: 0,
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

    #draggingCardsData = null;

    #cardSpriteSheet;

    constructor() {
        // Calculate dimensions/positions of our stacks. These will never change during a game.
        const dimensions = this.dimensions;

        dimensions.cardYOffset = Math.round(dimensions.cardHeight/3);
        dimensions.cardXOffset = Math.round(dimensions.cardWidth/3);

        dimensions.centerX = dimensions.boardWidth/2;
        dimensions.centerY = dimensions.boardHeight/2;

        dimensions.foundationX = dimensions.centerX - (dimensions.cardWidth * 2) - (dimensions.cardGap * 1.5);
        dimensions.foundationY = dimensions.centerY - (dimensions.cardHeight/2);

        dimensions.tableauX = dimensions.centerX - (dimensions.cardWidth * 3.5) - (dimensions.cardGap * 3);
        dimensions.tableauY = dimensions.foundationY + dimensions.cardHeight + dimensions.cardGap;

        dimensions.handDownX = dimensions.tableauX - (dimensions.cardWidth * 2) - (dimensions.cardGap * 2);
        dimensions.handDownY = dimensions.tableauY + dimensions.cardHeight + dimensions.cardGap;

        dimensions.handUpX = dimensions.handDownX + dimensions.cardWidth + dimensions.cardGap;
        dimensions.handUpY = dimensions.handDownY;

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

    static getInstance() {
        if (!this.#instance) {
            this.#instance = new Game();
        }

        return this.#instance;
    }

    reset() {
        const { cardWidth, cardHeight, cardYOffset, cardGap, cardMargin } = this.dimensions;

        this.hand = new Hand(this.dimensions.handDownX, this.dimensions.handDownY, cardWidth, cardHeight);

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
            const x = this.dimensions.tableauX + ((cardWidth + cardGap) * i);
            const y = this.dimensions.tableauY;

            return new Tableau(x, y, cardWidth, cardHeight);
        });
        this.foundations = Array.from({ length: 4 }, (e, i) => {
            const x = this.dimensions.foundationX + ((cardWidth + cardGap) * i);
            const y = this.dimensions.foundationY;

            return new Foundations(x, y, cardWidth, cardHeight);
        });
    }

    deal() {
        this.reset();

        // Shuffle (Fisher-Yates) hand before dealing
        for (let i = this.hand.down.length-1; i >= 0; i--) {
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
     * Check clickable Card and Stack hitboxes at a given coordinate.
     * @param {number} x X board coordinate.
     * @param {number} y Y board coordinate.
     */
    #pickTargetAtPoint(x, y) {
        if ( this.hand.isPointIntersected(x, y) ) {
            if ( !this.hand.restart() ) {
                this.hand.flip();
            }

            this.camera.forceUpdate();
            return;
        }

        // Check Draggable Card hitboxes
        const topCard = this.hand.top('up');
        if (topCard) {
            const draggingCardsData = {
                stack: this.hand,
                stackIndex: ['hand', 'up'],
                cards: [],
            };
            if ( topCard.isPointIntersected(x, y) ) {
                topCard.isDragging = true;
                this.#draggingCardsData = {
                    stack: this.hand,
                    stackIndex: ['hand', 'up'],
                    cards: [{
                        index: this.hand.up.length-1,
                        card: topCard,
                        dragOffset: {
                            x: x - topCard.position.x,
                            y: y - topCard.position.y
                        }
                    }]
                };
                return;
            }
        }

        for (let i = this.tableau.length-1; i >= 0; i--) {
            // Check if coordinates are in Stack hitbox before checking cards
            if ( this.tableau[i].isPointIntersected(x, y) ) {
                const draggingCardsData = {
                    stack: this.tableau[i],
                    stackIndex: ['tableau', i, 'up'],
                    cards: [],
                };

                for (let j = this.tableau[i].up.length-1; j >= 0; j--) {
                    const { position } = this.tableau[i].up[j];
                    draggingCardsData.cards.push({
                        index: j,
                        card: this.tableau[i].up[j],
                        dragOffset: {
                            x: x - position.x,
                            y: y - position.y
                        }
                    });
                    if ( this.tableau[i].up[j].isPointIntersected(x, y) ) {
                        for (let j = 0; j < draggingCardsData.cards.length; j++) {
                            draggingCardsData.cards[j].card.isDragging = true;
                        }
                        this.#draggingCardsData = draggingCardsData;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Check if we can drop the currently dragged cards.
     * @param {number} x X board coordinate
     * @param {number} y Y board coordinate
     */
    #dropCardsAtPoint(x, y) {
        const { stack, cards } = this.#draggingCardsData;

        for (let i = this.tableau.length-1; i >= 0; i--) {
            if ( this.tableau[i].isPointIntersected(x, y) ) {
                if ( this.tableau[i].isValidDrop(cards[cards.length-1].card) ) {
                    for (let j = cards.length-1; j >= 0; j--) {
                        stack.up.pop(); // Dragged cards will always be from up
                        this.tableau[i].push(cards[j].card, 'up');
                    }
                    
                    this.#resetDraggingCardsData();
                    this.camera.forceUpdate();
                    return;
                }
            }
        }

        // Foundations will only take a single dragged card
        if (cards.length === 1) {
            for (let i = this.foundations.length-1; i >= 0; i--) {
                if ( this.foundations[i].isPointIntersected(x, y) ) {
                    if ( this.foundations[i].isValidDrop(cards[0].card) ) {
                        stack.up.pop(); // Dragged cards will always be from up
                        this.foundations[i].push(cards[0].card, 'up');
    
                        this.#resetDraggingCardsData();
                        this.camera.forceUpdate();
                        return;
                    }
                }
            }
        }
        
        this.#resetDraggingCardsData();
        return;
    }

    #resetDraggingCardsData() {
        this.#draggingCardsData.stack.reset();
        for (let i = 0; i < this.#draggingCardsData.cards.length; i++) {
            this.#draggingCardsData.cards[i].card.isDragging = false;
        }

        this.camera.forceUpdate();
        this.#draggingCardsData = null;
    }

    #getCardAtIndex(index) {
        if (index !== null && index.length > 0) {
            let card = this[index[0]];
            for (let i = 1; i < index.length; i++) {
                card = card[index[i]];
            }

            return card;
        }

        return null;
    }

    mouseEvent(e) {
        if (e.type === 'mousedown') {
            this.mouse.button = true;
        }

        this.mouse.position = {
            x: e.clientX - e.target.offsetLeft,
            y: e.clientY - e.target.offsetTop
        };
    
        if (this.mouse.button) {
            if (e.type === 'mousedown') {
                const { x, y } = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);
                this.#pickTargetAtPoint(x, y);
            } else if (e.type === 'mousemove') {
                if (this.#draggingCardsData !== null) {
                    const newPosition = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);

                    const { cards } = this.#draggingCardsData;
                    for (let i = 0; i < cards.length; i++) {
                        cards[i].card.position.x = newPosition.x - cards[i].dragOffset.x;
                        cards[i].card.position.y = newPosition.y - cards[i].dragOffset.y;
                    }
                    
                    this.camera.forceUpdate();
                } else {
                    const x = this.mouse.position.x - this.mouse.oldPosition.x;
                    const y = this.mouse.position.y - this.mouse.oldPosition.y;
                    this.camera.pan({ x, y });
                }
            } else if (e.type === 'mouseup' && this.#draggingCardsData !== null) {
                const { x, y } = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);
                this.#dropCardsAtPoint(x, y);
            }

            // check x and y seperately so the window doesnt get stuck
            // if (checkWindowXCollision(bg_coords, translation)) {
            //     camera.current.x += moveStart.current.x - x;
            // }
            // if (checkWindowYCollision(bg_coords, translation)) {
            //     camera.current.y += moveStart.current.y - y;
            // }
        }

        if (e.type === 'mouseup' || e.type === 'mouseout') {
            this.mouse.button = false;
        }
    }

    scrollEvent(e) {
        this.camera.scaleAt({ x: e.clientX, y: e.clientY }, e.deltaY);
    }
}

/**
 * 
 * @returns {Game}
 */
export function getGame() {
    return Game.getInstance();
}

export function useGame() {
    const game = useRef(getGame());

    return { game: game.current };
}
