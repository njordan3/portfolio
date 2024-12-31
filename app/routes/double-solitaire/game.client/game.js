import { Mouse } from './mouse';
import Camera from './camera';
import cardSpriteSheet from '@images/decksprite.png';
import { getImage } from '@/utils/images';

/**
 * Singleton Game instance
 */
export class Game {
    tableau;        // 7 piles that make up the main table
    foundations;    // 4 piles that build on the 4 aces
    hand;           // Cards in hand

    camera;
    mouse;

    static $cardFrontImages = [];
    static $cardBackImage;

    static $instance;

    static dimensions = {
        boardWidth: 0,
        boardHeight: 0,
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

    $draggingCardsData = null;

    static $cardSpriteSheet;

    constructor() {
        if (!this.$instance) {
            this.mouse = new Mouse();
            this.camera = new Camera();
        }
    }

    get cardBackImage() {
        return Game.$cardBackImage;
    }

    get dimensions() {
        return Game.dimensions;
    }

    /**
     * Load card front and back images into offscreen canvas contexts.
     * Needs dimensions to be set before running.
     */
    static #assetPromise;
    static loadAssets() {
        if (Game.#assetPromise) {
            return Game.#assetPromise;
        }

        const { cardWidth, cardHeight } = Game.dimensions;
        return Game.#assetPromise = new Promise(async (resolve) => {
            const value = await getImage(cardSpriteSheet);
            Game.$cardSpriteSheet = value;

            Game.$cardFrontImages = [];
            for (let i = 0; i < 52; i++) {
                const rank = i % 13;
                const suit = i % 4;
    
                const canvas = new OffscreenCanvas(cardWidth, cardHeight);
                const context = canvas.getContext('2d', { alpha: false });
                context.drawImage(
                    Game.$cardSpriteSheet,
                    rank * cardWidth, suit * cardHeight,
                    cardWidth, cardHeight,
                    0, 0,
                    cardWidth, cardHeight,
                );
                context.save();
                Game.$cardFrontImages.push(context);
            }
    
            const canvas = new OffscreenCanvas(cardWidth, cardHeight);
            const context = canvas.getContext('2d', { alpha: false });
            context.drawImage(
                Game.$cardSpriteSheet,
                0, 4 * cardHeight,
                cardWidth, cardHeight,
                0, 0,
                cardWidth, cardHeight,
            );
            context.save();
    
            Game.$cardBackImage = context;

            resolve();
        });
    }

    reset() {}

    deal() {}

    $onCardPick(x, y) {}

    $onCardMove(x, y) {}

    $onCardDrop(x, y) {}

    /**
     * Check clickable Card and Stack hitboxes at a given coordinate.
     * @param {number} x X board coordinate.
     * @param {number} y Y board coordinate.
     */
    #pickTargetAtPoint(x, y) {
        if ( this.hand.isPointIntersected(x, y) ) {
            this.$onCardPick(x, y);

            if ( !this.hand.restart() ) {
                this.hand.flip();
            }

            this.camera.forceUpdate();
            return;
        }

        // Check Draggable Card hitboxes
        const topCard = this.hand.top('up');
        if (topCard) {
            if ( topCard.isPointIntersected(x, y) ) {
                this.$onCardPick(x, y);
                topCard.isDragging = true;
                this.$draggingCardsData = {
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
                this.$onCardPick(x, y);
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
                        this.$draggingCardsData = draggingCardsData;
                        return;
                    }
                }

                break;
            }
        }
    }

    /**
     * Check if we can drop the currently dragged cards.
     * @param {number} x X board coordinate
     * @param {number} y Y board coordinate
     */
    #dropCardsAtPoint(x, y) {
        const { stack, cards } = this.$draggingCardsData;

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
        this.$draggingCardsData.stack.reset();
        for (let i = 0; i < this.$draggingCardsData.cards.length; i++) {
            this.$draggingCardsData.cards[i].card.isDragging = false;
        }

        this.camera.forceUpdate();
        this.$draggingCardsData = null;
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
                if (this.$draggingCardsData !== null) {
                    const { x, y } = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);

                    const { cards } = this.$draggingCardsData;
                    for (let i = 0; i < cards.length; i++) {
                        cards[i].card.position.x = x - cards[i].dragOffset.x;
                        cards[i].card.position.y = y - cards[i].dragOffset.y;
                    }
                    
                    this.camera.forceUpdate();
                    this.$onCardMove(x, y);
                } else {
                    const x = this.mouse.position.x - this.mouse.oldPosition.x;
                    const y = this.mouse.position.y - this.mouse.oldPosition.y;
                    this.camera.pan({ x, y });
                }
            } else if (e.type === 'mouseup' && this.$draggingCardsData !== null) {
                const { x, y } = this.camera.getBoardPosition(this.mouse.position.x, this.mouse.position.y);
                this.$onCardDrop(x, y);
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
