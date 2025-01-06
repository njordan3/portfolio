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