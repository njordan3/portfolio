import Card from "./game/card.js";
import { PlayerType } from "./game/constants.js";
import { getPlayerTypeDimensions, MultiplayerDimensions } from "./game/dimensions.js";
import Hand from "./game/hand.js";
import Tableau from "./game/tableau.js";
import { generateRandomInt } from "./utils.js";

export class UserGameState {
    #gameId;
    get gameId() {
        return this.#gameId;
    }

    ready = false;
    connected = true;
    done = false;

    #tableau;        // 7 piles that make up the main table
    #hand;           // Cards in hand

    _draggingCardsData = null;

    constructor(gameId) {
        this.#gameId = gameId; 
    }

    resetCards(playerType) {
        const dimensions = MultiplayerDimensions.getInstance();
        const { cardWidth, cardHeight, cardGap } = dimensions;
        const { handDownX, handDownY, tableauX, tableauY } = getPlayerTypeDimensions(playerType);
        const isOpponent = playerType === PlayerType.OPPONENT;
        
        this.#hand = new Hand(handDownX, handDownY, cardWidth, cardHeight, playerType);
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 0; rank < 13; rank++) {
                this.#hand.push(new Card(suit, rank, isOpponent));
            }
        }

        this.#tableau = Array.from({ length: 7 }, (e, i) => {
            const x = tableauX + ((cardWidth + cardGap) * i);
            const y = tableauY;
            return new Tableau(x, y, cardWidth, cardHeight, playerType);
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
        if (topCard) {
            if ( topCard.isPointIntersected(x, y) ) {
                topCard.isDragging = true;
                this._draggingCardsData = {
                    stack: this.#hand,
                    stackIndex: ['hand', 'up'],
                    cards: [{
                        index: this.#hand.up.length-1,
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

        for (let i = this.#tableau.length-1; i >= 0; i--) {
            // Check if coordinates are in Stack hitbox before checking cards
            if ( this.#tableau[i].isPointIntersected(x, y) ) {
                const draggingCardsData = {
                    stack: this.#tableau[i],
                    stackIndex: ['tableau', i, 'up'],
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
                        return;
                    }
                }

                break;
            }
        }
    }

    toJSON() {
        return {
            ready: this.ready,
            connected: this.connected,
            done: this.done,
            hand: this.#hand,
            tableau: this.#tableau
        };
    }
}