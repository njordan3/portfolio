import { Camera, Card, Hand, Mouse } from './internal'
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

    _started = true;

    static _cardSpriteSheet;
    static get cardSpriteSheet() {
        return Game._cardSpriteSheet;
    }

    static _boardTexture;
    static get boardTexture() {
        return Game._boardTexture;
    }

    static _cardFrontImages = [];
    static get cardFrontImages() {
        return Game._cardFrontImages;
    }

    static _cardFrontImagesFlipped = [];
    static get cardFrontImagesFlipped() {
        return Game._cardFrontImagesFlipped;
    }

    static _cardBackImage;
    static get cardBackImage() {
        return Game._cardBackImage;
    }

    // Gets loaded from the server
    static ranks;
    static suits;
    static playerTypes;
    static dimensions = {
        boardWidth: 0,
        boardHeight: 0,
        cardWidth: 0,
        cardHeight: 0,
        stackGap: 0,
        cardMargin: 0,
        cardXOffset: 0,
        cardYOffset: 0,
        centerX: 0,
        centerY: 0,
        tableauX: 0,
        tableauY: 0,
        tableauWidth: 0,
        handDownX: 0,
        handDownY: 0,
        handUpX: 0,
        handUpY: 0,
        handWidth: 0,
        foundationX: 0,
        foundationY: 0,
        foundationWidth: 0,
        startX: 0,
        startY: 0,
    };

    _draggingCardsData = null;

    // Singleton
    static _instance;

    /**
     * Load card front and back images into offscreen canvas contexts.
     * Needs dimensions to be set before running.
     */
    static #assetPromise;
    static loadAssets() {
        if (Game.#assetPromise) {
            return Game.#assetPromise;
        }

        return Game.#assetPromise = new Promise(async (resolve) => {
            const [spriteSheet, boardTexture] = await Promise.all([getImage(cardSpriteSheet), getImage(felt)]);
            Game._cardSpriteSheet = spriteSheet;
            Game._boardTexture = boardTexture;

            Game._cardFrontImages = [];
            for (let suit = 0; suit < 4; suit++) {
                for (let rank = 0; rank < 13; rank++) {
                    {
                        const canvas = new OffscreenCanvas(Card.width, Card.height);
                        const context = canvas.getContext('2d');
                        context.drawImage(
                            Game._cardSpriteSheet,
                            rank * Card.width, suit * Card.height,
                            Card.width, Card.height,
                            0, 0,
                            Card.width, Card.height,
                        );
                        context.save();
                        Game._cardFrontImages.push(context);
                    }

                    {
                        const canvas = new OffscreenCanvas(Card.width, Card.height);
                        const context = canvas.getContext('2d', { alpha: false });
                        context.translate(Card.width, Card.height);
                        context.rotate(Math.PI);
                        context.drawImage(
                            Game._cardSpriteSheet,
                            rank * Card.width, suit * Card.height,
                            Card.width, Card.height,
                            0, 0,
                            Card.width, Card.height,
                        );
                        context.save();

                        Game._cardFrontImagesFlipped.push(context);
                    }
                    
                }
            }
    
            const canvas = new OffscreenCanvas(Card.width, Card.height);
            const context = canvas.getContext('2d', { alpha: false });
            context.drawImage(
                Game._cardSpriteSheet,
                0, 4 * Card.height,
                Card.width, Card.height,
                0, 0,
                Card.width, Card.height,
            );
            context.save();
    
            Game._cardBackImage = context;

            resolve();
        });
    }

    callGetDimensions(playerType = null) {
        return Game.getDimensions(playerType);
    }

    static getDimensions(playerType = null) {
        return Game.dimensions;
    }

    renderForeground(drawDraggingCards = true) {
        const camera = Camera.getInstance();
        
        const { foreground } = camera.contexts;
        const { tableau, foundations, hand } = this;

        // Render only top cards
        for (let i = 0; i < foundations.length; i++) {
            foundations[i].renderForeground(foreground);
        }
        
        hand.renderForeground(foreground);
        
        for (let i = 0; i < tableau.length; i++) {
            tableau[i].renderForeground(foreground);
        }

        // Render dragging cards last so they appear on top
        if (drawDraggingCards) {
            this.renderDraggingCards();
        }
    }

    renderDraggingCards() {
        const camera = Camera.getInstance();
        const { foreground } = camera.contexts;

        if (this._draggingCardsData) {
            let indexCard = this._draggingCardsData.cards[0].card;
            if (this._draggingCardsData.cards.length-1 > 0) {
                indexCard = this._draggingCardsData.cards[this._draggingCardsData.cards.length-1].card;
            }
            const topCard = this._draggingCardsData.cards[0].card;
            const height = Card.height + Math.abs(indexCard.position.y - topCard.position.y);

            const { position } = topCard.yFlipped ? topCard : indexCard;
            
            foreground.fillStyle = 'rgb(98 196 255 / 50%)';
            foreground.fillRect(position.x - Card.highlightWidth, position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), height + (Card.highlightWidth * 2));
            
            for (let i = this._draggingCardsData.cards.length-1; i >= 0; i--) {
                this._draggingCardsData.cards[i].card.draw(foreground);
            }
        }
    }

    renderBackground() {
        const camera = Camera.getInstance();

        const { background } = camera.contexts;
        const { boardWidth, boardHeight } = this.callGetDimensions();

        background.fillStyle = background.createPattern(Game._boardTexture, 'repeat');
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

    _onCardPick(x, y) {}

    _onCardMove(x, y) {}

    async _onCardDrop(x, y, dropTarget) {}

    /**
     * Check clickable Card and Stack hitboxes at a given coordinate.
     * @param {number} x X board coordinate.
     * @param {number} y Y board coordinate.
     */
    #pickTargetAtPoint(x, y) {
        if (!this._started) {
            return;
        }

        const mouse = Mouse.getInstance();
        if (this.hand.isPointIntersectBlock(x, y)) {
            mouse.avoidPan = true;
        }

        if ( this.hand.isPointIntersected(x, y) ) {
            this._onCardPick(x, y);

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
                this._onCardPick(x, y);
                topCard.isDragging = true;
                this._draggingCardsData = {
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

        if (this.tableau[0].isPointIntersectBlock(x, y)) {
            mouse.avoidPan = true;
        }

        for (let i = this.tableau.length-1; i >= 0; i--) {
            // Check if coordinates are in Stack hitbox before checking cards
            if ( this.tableau[i].isPointIntersected(x, y) ) {
                this._onCardPick(x, y);
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
                        this._draggingCardsData = draggingCardsData;
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
        if (!this._started) {
            return false;
        }
        
        const { stack, cards } = this._draggingCardsData;

        for (let i = this.tableau.length-1; i >= 0; i--) {
            if ( this.tableau[i].isPointIntersected(x, y) ) {
                if ( this.tableau[i].isValidDrop(cards[cards.length-1].card) ) {
                    for (let j = cards.length-1; j >= 0; j--) {
                        stack.up.pop(); // Dragged cards will always be from up
                        this.tableau[i].push(cards[j].card, 'up');
                    }
                    
                    this._resetDraggingCardsData();
                    return `tableau.${i}`;
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
    
                        this._resetDraggingCardsData();
                        return `foundations.${i}`;
                    }
                }
            }
        }
        
        this._resetDraggingCardsData();
        return false;
    }

    _resetDraggingCardsData() {
        if (this._draggingCardsData) {
            this._draggingCardsData.stack.reset();
            for (let i = 0; i < this._draggingCardsData.cards.length; i++) {
                this._draggingCardsData.cards[i].card.isDragging = false;
            }
    
            Camera.getInstance().forceUpdate();
        }
        
        this._draggingCardsData = null;
    }

    _getObjectAtIndex(index, player = null) {
        const source = (player && index[0] !== 'foundations') ? player : this;
        if (index !== null && index.length > 0) {
            let object = source[index[0]];
            for (let i = 1; i < index.length; i++) {
                object = object[index[i]];
            }

            return object;
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

        const { x, y } = camera.getBoardPosition(mouse.position.x, mouse.position.y);

        let hoverChanged = false;
        let handDownHovering = false;

        // Check if we are hovering the top hand card
        const oldHighlightDownEmpty = this.hand.highlightDownEmpty;
        this.hand.highlightDownEmpty = false;
        if (this.hand.isPointIntersected(x, y)) {
            handDownHovering = true;
            this.hand.highlightDownEmpty = true;
        }
        if (!this.hand.highlightDownEmpty !== oldHighlightDownEmpty) {
            hoverChanged = true;
        }

        let handUpHovering = false;
        const upHandIndex = this.hand.up.length-1;
        if (upHandIndex >= 0) {
            const oldHighlightIndex = this.hand.highlightIndex;
            this.hand.highlightIndex = null;
            const topCard = this.hand.up[upHandIndex];
            if (topCard.isPointIntersected(x, y)) {
                handUpHovering = true;
                this.hand.highlightIndex = upHandIndex;
            }

            if (this.hand.highlightIndex !== oldHighlightIndex) {
                hoverChanged = true;
            }
        }

        // Check if we are hovering a card in the tableaus
        let tableauHovering = false;
        for (let i = 0; i < this.tableau.length; i++) {
            const oldHighlightDownEmpty = this.tableau[i].highlightDownEmpty;
            this.tableau[i].highlightDownEmpty = false;
            if (this.tableau[i].isPointIntersected(x, y)) {
                tableauHovering = true;
                this.tableau[i].highlightDownEmpty = true;
            }
            if (!this.tableau[i].highlightDownEmpty !== oldHighlightDownEmpty) {
                hoverChanged = true;
            }

            const oldHighlightIndex = this.tableau[i].highlightIndex;
            this.tableau[i].highlightIndex = null;
            for (let j = this.tableau[i].up.length-1; j >= 0; j--) {
                const card = this.tableau[i].up[j];
                if (card.isPointIntersected(x, y)) {
                    tableauHovering = true;
                    this.tableau[i].highlightIndex = j;
                    break;
                }
            }

            if (this.tableau[i].highlightIndex !== oldHighlightIndex) {
                hoverChanged = true;
            }
        }

        // Check if we are hovering a card in the tableaus
        let foundationsHovering = false;
        for (let i = 0; i < this.foundations.length; i++) {
            const oldHighlightDownEmpty = this.foundations[i].highlightDownEmpty;
            this.foundations[i].highlightDownEmpty = false;
            if (this.foundations[i].isPointIntersected(x, y)) {
                foundationsHovering = true;
                this.foundations[i].highlightDownEmpty = true;
            }
            if (!this.foundations[i].highlightDownEmpty !== oldHighlightDownEmpty) {
                hoverChanged = true;
            }

            const oldHighlightIndex = this.foundations[i].highlightIndex;
            this.foundations[i].highlightIndex = null;

            if (!foundationsHovering) {
                const topCardIndex = this.foundations[i].up.length-1;
                if (topCardIndex >= 0) {
                    const topCard = this.foundations[i].up[topCardIndex];
                    if (topCard.isPointIntersected(x, y)) {
                        foundationsHovering = true;
                        this.foundations[i].highlightIndex = topCardIndex;
                    }
                }
            }

            if (this.foundations[i].highlightIndex !== oldHighlightIndex) {
                hoverChanged = true;
            }
        }

        if (hoverChanged) {
            camera.forceUpdate();
        }
    
        if (mouse.button) {
            if (e.type === 'mousedown') {
                this.#pickTargetAtPoint(x, y);
            } else if (e.type === 'mousemove') {
                if (this._draggingCardsData !== null) {
                    const { cards } = this._draggingCardsData;
                    for (let i = 0; i < cards.length; i++) {
                        cards[i].card.position.x = x - cards[i].dragOffset.x;
                        cards[i].card.position.y = y - cards[i].dragOffset.y;
                    }
                    
                    camera.forceUpdate();
                    this._onCardMove(x, y);
                } else if (!mouse.avoidPan) {
                    const x = mouse.position.x - mouse.oldPosition.x;
                    const y = mouse.position.y - mouse.oldPosition.y;
                    camera.pan({ x, y });
                }
            } else if (e.type === 'mouseup' && this._draggingCardsData !== null) {
                const dropTarget = this.#dropCardsAtPoint(x, y);
                this._onCardDrop(x, y, dropTarget);
            }
        }

        // Update cursor based on what is happening
        const { foreground } = camera.contexts;
        if (this._draggingCardsData !== null) {
            foreground.canvas.style.cursor = 'grabbing';
        } else if (handUpHovering || handDownHovering || tableauHovering || foundationsHovering) {
            if (!this._started || foundationsHovering) {
                foreground.canvas.style.cursor = 'no-drop';
            } else if (handDownHovering) {
                foreground.canvas.style.cursor = 'pointer';
            } else {
                foreground.canvas.style.cursor = 'grab';
            }
        } else if (mouse.button && !mouse.avoidPan) {
            foreground.canvas.style.cursor = 'move';
        } else {
            foreground.canvas.style.cursor = 'auto';
        }

        if (e.type === 'mouseup' || e.type === 'mouseout') {
            mouse.button = false;
            mouse.avoidPan = false;
        }
    }

    scrollEvent(e) {
        Camera.getInstance().scaleAt({ x: e.clientX, y: e.clientY }, e.deltaY);
    }
}
