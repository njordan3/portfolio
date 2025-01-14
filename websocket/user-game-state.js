import { Card, Hand, Tableau, PlayerType, getPlayerTypeDimensions } from "./game/internal.js";
import { generateRandomInt } from "./utils.js";

export class UserGameState {
    #gameId;
    get gameId() {
        return this.#gameId;
    }

    flags = {
        ready: false,
        connected: true,
        done: false,
        voteRestart: false
    };

    get connected() {
        return this.flags.connected;
    }
    get ready() {
        return this.flags.ready;
    }
    get done() {
        return this.flags.done;
    }
    get voteRestart() {
        return this.flags.voteRestart;
    }

    #tableau;        // 7 piles that make up the main table
    #hand;           // Cards in hand

    _draggingCardsData = null;
    get draggingCardsData() {
        return this._draggingCardsData;
    }

    constructor(gameId) {
        this.#gameId = gameId; 
    }

    resetCards(playerType) {
        const { stackGap, handDownX, handDownY, tableauX, tableauY } = getPlayerTypeDimensions(playerType);
        const isOpponent = playerType === PlayerType.OPPONENT;

        this.#hand = new Hand(handDownX, handDownY, Card.width, Card.height, playerType);
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 0; rank < 13; rank++) {
                this.#hand.push(new Card(suit, rank, isOpponent));
            }
        }

        this.#tableau = Array.from({ length: 7 }, (e, i) => {
            const x = tableauX + ((Card.width + stackGap) * i);
            const y = tableauY;
            return new Tableau(x, y, Card.width, Card.height, playerType);
        });
    }

    dealCards(playerType) {
        const isOpponent = playerType === PlayerType.OPPONENT;
        this.resetCards(playerType);

        // Shuffle (Fisher-Yates) hand before dealing
        for (let i = this.#hand.down.length-1; i >= 0; i--) {
            const random = generateRandomInt(0, i);
            const swap = this.#hand.down[random];
            this.#hand.down[random] = this.#hand.down[i];
            this.#hand.down[i] = swap;
        }

        // The deal
        if (isOpponent) {
            // Opponent deals right to left since they are flipped
            for (let i = 6; i >= 0; i--) {
                for (let j = i; j >= 0; j--) {
                    this.#tableau[j].push(this.#hand.down.pop(), 'down');
                }
            }
        } else {
            for (let i = 0; i < this.#tableau.length; i++) {
                for (let j = i; j < this.#tableau.length; j++) {
                    this.#tableau[j].push(this.#hand.down.pop(), 'down');
                }
            }
        }

        for (let i = 0; i < this.#tableau.length; i++) {
            this.#tableau[i].flip();
        }
    }

    start() {
        this.flags.ready = false;
        this.flags.done = false;
        this.flags.voteRestart = false;
    }

    restart(playerType) {
        this.dealCards(playerType);
        this.start();
    }

    pickTargetAtPoint(socket, x, y) {
        if ( this.#hand.isPointIntersected(x, y) ) {
            if ( !this.#hand.restart() ) {
                this.#hand.flip();
            }

            socket.to(this.#gameId).emit('player-hand-flip', { id: socket.user.id });
            return;
        }

        // Check Draggable Card hitboxes
        const topCard = this.#hand.top('up');
        if (topCard && topCard.isPointIntersected(x, y)) {
            topCard.isDragging = true;
            this._draggingCardsData = {
                stack: this.#hand,
                stackIndex: ['hand'],
                cards: [{
                    index: this.#hand.up.length-1,
                    card: topCard,
                    dragOffset: {
                        x: x - topCard.position.x,
                        y: y - topCard.position.y
                    }
                }]
            };

            socket.to(this.#gameId).emit('player-card-drag-start', { id: socket.user.id, draggingCardsData: this.draggingCardsJSON() });
            return;
        }

        for (let i = this.#tableau.length-1; i >= 0; i--) {
            // Check if coordinates are in Stack hitbox before checking cards
            if ( this.#tableau[i].isPointIntersected(x, y) ) {
                const draggingCardsData = {
                    stack: this.#tableau[i],
                    stackIndex: ['tableau', i],
                    cards: [],
                };

                for (let j = this.#tableau[i].up.length-1; j >= 0; j--) {
                    const { position } = this.#tableau[i].up[j];
                    draggingCardsData.cards.push({
                        index: j,
                        card: this.#tableau[i].up[j],
                        dragOffset: {
                            x: x - position.x,
                            y: y - position.y
                        }
                    });
                    if ( this.#tableau[i].up[j].isPointIntersected(x, y) ) {
                        for (let j = 0; j < draggingCardsData.cards.length; j++) {
                            draggingCardsData.cards[j].card.isDragging = true;
                        }
                        this._draggingCardsData = draggingCardsData;
                        
                        socket.to(this.#gameId).emit('player-card-drag-start', { id: socket.user.id, draggingCardsData: this.draggingCardsJSON() });
                        return;
                    }
                }

                break;
            }
        }
    }

    #cardMoveTimeout;
    dragCards(socket, x, y) {
        if (!this.#cardMoveTimeout) {
            if (this._draggingCardsData !== null) {

                const { cards } = this._draggingCardsData;
                for (let i = 0; i < cards.length; i++) {
                    cards[i].card.position.x = x - cards[i].dragOffset.x;
                    cards[i].card.position.y = y - cards[i].dragOffset.y;
                }
    
                socket.to(this.#gameId).volatile.emit('player-card-drag', { id: socket.user.id, position: { x, y } });
            }

            this.#cardMoveTimeout = setTimeout(() => {
                this.#cardMoveTimeout = undefined;
            }, 41); // ~24 updates/s throttle
        }
    }

    dropCardsAtPoint(socket, x, y) {
        if (!this._draggingCardsData) {
            return false;
        }
        
        const { stack, cards } = this._draggingCardsData;

        for (let i = this.#tableau.length-1; i >= 0; i--) {
            if ( this.#tableau[i].isPointIntersected(x, y) ) {
                if ( this.#tableau[i].isValidDrop(cards[cards.length-1].card) ) {
                    for (let j = cards.length-1; j >= 0; j--) {
                        stack.up.pop(); // Dragged cards will always be from up
                        this.#tableau[i].push(cards[j].card, 'up');
                    }

                    // Deliver dragging cards data one more time just in case the user doesn't have it
                    socket.to(this.#gameId).emit('player-card-drop', {
                        id: socket.user.id,
                        targetStackIndex: ['tableau', i],
                        draggingCardsData: this.draggingCardsJSON()
                    });
                    this.resetDraggingCardsData();
                    return `tableau.${i}`;
                }
            }
        }
        
        return false;
    }

    resetDraggingCardsData() {
        if (this._draggingCardsData) {
            this._draggingCardsData.stack.reset();
            for (let i = 0; i < this._draggingCardsData.cards.length; i++) {
                this._draggingCardsData.cards[i].card.isDragging = false;
            }
        }

        this._draggingCardsData = null;
    }

    draggingCardsJSON() {
        if (!this._draggingCardsData) {
            return null;
        }

        const { stackIndex, cards } = this._draggingCardsData;
        const cardsJSON = [];
        for (let i = 0; i < cards.length; i++) {
            const { index, dragOffset } = cards[i];
            cardsJSON.push({ index, dragOffset });
        }

        return {
            stackIndex,
            cards: cardsJSON,
        };
    }

    getCards() {
        const tableau = [];
        for (let i = 0; i < this.#tableau.length; i++) {
            tableau.push(this.#tableau[i].toJSON());
        }

        return {
            hand: this.#hand.toJSON(),
            tableau,
        }
    }

    toJSON() {
        const tableau = [];
        for (let i = 0; i < this.#tableau.length; i++) {
            tableau.push(this.#tableau[i].toJSON());
        }

        return {
            ...this.flags,
            ...this.getCards(),
            draggingCardsData: this.draggingCardsJSON(),
        };
    }
}