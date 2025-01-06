import { Camera, Hand, Mouse } from './internal'
import cardSpriteSheet from '@images/decksprite.png';
import felt from '@images/tabletopfelt.jpg';
import { getImage } from '@/utils/images';

/**
 * Singleton Game instance
 */
export class Game {
    tableau;        // 7 piles that make up the main table
    foundations;    // 4 piles that build on the 4 aces
    hand;           // Cards in hand

    static $cardSpriteSheet;
    static get cardSpriteSheet() {
        return Game.$cardSpriteSheet;
    }

    static $boardTexture;
    static get boardTexture() {
        return Game.$boardTexture;
    }

    static $cardFrontImages = [];
    static get cardFrontImages() {
        return Game.$cardFrontImages;
    }

    static $cardFrontImagesFlipped = [];
    static get cardFrontImagesFlipped() {
        return Game.$cardFrontImagesFlipped;
    }

    static $cardBackImage;
    static get cardBackImage() {
        return Game.$cardBackImage;
    }

    // Gets loaded from the server
    static ranks;
    static suits;
    static dimensions = {
        boardWidth: 0,
        boardHeight: 0,
        cardWidth: 0,
        cardHeight: 0,
        cardGap: 0,
        cardMargin: 0,
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
        startX: 0,
        startY: 0,
    };

    $draggingCardsData = null;

    // Singleton
    static $instance;

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
            const [spriteSheet, boardTexture] = await Promise.all([getImage(cardSpriteSheet), getImage(felt)]);
            Game.$cardSpriteSheet = spriteSheet;
            Game.$boardTexture = boardTexture;

            Game.$cardFrontImages = [];
            for (let suit = 0; suit < 4; suit++) {
                for (let rank = 0; rank < 13; rank++) {
                    {
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

                    {
                        const canvas = new OffscreenCanvas(cardWidth, cardHeight);
                        const context = canvas.getContext('2d', { alpha: false });
                        context.translate(cardWidth, cardHeight);
                        context.rotate(Math.PI);
                        context.drawImage(
                            Game.$cardSpriteSheet,
                            rank * cardWidth, suit * cardHeight,
                            cardWidth, cardHeight,
                            0, 0,
                            cardWidth, cardHeight,
                        );
                        context.save();

                        Game.$cardFrontImagesFlipped.push(context);
                    }
                    
                }
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

    getDimensions() {
        return Game.dimensions;
    }

    renderForeground() {
        const camera = Camera.getInstance();
        
        const { foreground } = camera.contexts;
        const { tableau, foundations, hand } = this;

        if (hand.top('down')) {
            foreground.drawImage(Game.cardBackImage.canvas, hand.position.x, hand.position.y);
        }

        const draggingCards = [];

        // Render only last 3 of hand up
        const indexClamp = (hand.up.length > Hand.dealAmount ? hand.up.length - Hand.dealAmount : 0);
        for (let i = indexClamp; i < hand.up.length; i++) {
            const { isDragging } = hand.up[i];
            if (isDragging) {
                draggingCards.push(hand.up[i]);
                continue;
            }

            hand.up[i].draw(foreground);
        }
        
        for (let i = 0; i < tableau.length; i++) {
            if (tableau[i].down.length > 0) {
                foreground.drawImage(Game.cardBackImage.canvas, tableau[i].position.x, tableau[i].position.y);
            }

            for (let j = 0; j < tableau[i].up.length; j++) {
                const { isDragging } = tableau[i].up[j];
                if (isDragging) {
                    draggingCards.push(tableau[i].up[j]);
                    continue;
                }

                tableau[i].up[j].draw(foreground);
            }
        }

        // Render only top cards
        for (let i = 0; i < foundations.length; i++) {
            const topCard = foundations[i].top('up');

            if (topCard) {
                topCard.draw(foreground);
            }
        }

        // Render dragging cards last so they appear on top
        for (let i = 0; i < draggingCards.length; i++) {
            draggingCards[i].draw(foreground);
        }
    }

    renderBackground() {
        const camera = Camera.getInstance();

        const { background } = camera.contexts;
        const { boardWidth, boardHeight } = this.getDimensions();

        background.fillStyle = background.createPattern(Game.$boardTexture, 'repeat');
        background.fillRect(0, 0, boardWidth, boardHeight);

        for (let i = 0; i < this.tableau.length; i++) {
            this.tableau[i].renderBackground(background);
        }

        for (let i = 0; i < this.foundations.length; i++) {
            this.foundations[i].renderBackground(background);
        }

        this.hand.renderBackground(background);
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
            console.log('asd');
            this.$onCardPick(x, y);

            if ( !this.hand.restart() ) {
                this.hand.flip();
            }

            Camera.getInstance().forceUpdate();
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
        const camera = Camera.getInstance();

        for (let i = this.tableau.length-1; i >= 0; i--) {
            if ( this.tableau[i].isPointIntersected(x, y) ) {
                if ( this.tableau[i].isValidDrop(cards[cards.length-1].card) ) {
                    for (let j = cards.length-1; j >= 0; j--) {
                        stack.up.pop(); // Dragged cards will always be from up
                        this.tableau[i].push(cards[j].card, 'up');
                    }
                    
                    this.#resetDraggingCardsData();
                    camera.forceUpdate();
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
                        camera.forceUpdate();
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

        Camera.getInstance().forceUpdate();
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
        const mouse = Mouse.getInstance();
        const camera = Camera.getInstance();

        if (e.type === 'mousedown') {
            mouse.button = true;
        }

        mouse.position = {
            x: e.clientX - e.target.offsetLeft,
            y: e.clientY - e.target.offsetTop
        };
    
        if (mouse.button) {
            if (e.type === 'mousedown') {
                const { x, y } = camera.getBoardPosition(mouse.position.x, mouse.position.y);
                this.#pickTargetAtPoint(x, y);
            } else if (e.type === 'mousemove') {
                if (this.$draggingCardsData !== null) {
                    const { x, y } = camera.getBoardPosition(mouse.position.x, mouse.position.y);

                    const { cards } = this.$draggingCardsData;
                    for (let i = 0; i < cards.length; i++) {
                        cards[i].card.position.x = x - cards[i].dragOffset.x;
                        cards[i].card.position.y = y - cards[i].dragOffset.y;
                    }
                    
                    camera.forceUpdate();
                    this.$onCardMove(x, y);
                } else {
                    const x = mouse.position.x - mouse.oldPosition.x;
                    const y = mouse.position.y - mouse.oldPosition.y;
                    camera.pan({ x, y });
                }
            } else if (e.type === 'mouseup' && this.$draggingCardsData !== null) {
                const { x, y } = camera.getBoardPosition(mouse.position.x, mouse.position.y);
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
            mouse.button = false;
        }
    }

    scrollEvent(e) {
        Camera.getInstance().scaleAt({ x: e.clientX, y: e.clientY }, e.deltaY);
    }
}
