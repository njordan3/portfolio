import { generateRandomInt } from '@/utils/misc';
import Foundations from './foundations';
import { Game } from './game';
import Hand from './hand';
import Tableau from './tableau';
import Card from './card';

export class SingleplayerGame extends Game {
    constructor() {
        super();

        if (this.$instance) {
            throw Error('Singleplayer Game already initialized');
        }

        // Calculate dimensions/positions of our stacks. These will never change during a game.
        const dimensions = SingleplayerGame.dimensions;

        dimensions.boardWidth = 2000;
        dimensions.boardHeight = 1000;

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

        SingleplayerGame.dimensions = Object.freeze(dimensions);
    }

    static getInstance() {
        if (!this.$instance) {
            this.$instance = new SingleplayerGame();
        }

        return this.$instance;
    }

    reset() {
        const { cardWidth, cardHeight, cardGap, handDownX, handDownY, tableauX, tableauY, foundationX, foundationY } = SingleplayerGame.dimensions;

        this.hand = new Hand(handDownX, handDownY, cardWidth, cardHeight);

        for (let i = 0; i < 52; i++) {
            const rank = i % 13;
            const suit = i % 4;
            const card = new Card(suit, rank);
            card.context = SingleplayerGame.$cardFrontImages[i];

            this.hand.push(card);
        }

        this.tableau = Array.from({ length: 7 }, (e, i) => {
            const x = tableauX + ((cardWidth + cardGap) * i);
            const y = tableauY;

            return new Tableau(x, y, cardWidth, cardHeight);
        });
        this.foundations = Array.from({ length: 4 }, (e, i) => {
            const x = foundationX + ((cardWidth + cardGap) * i);
            const y = foundationY;

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

        this.camera.forceUpdate();
    }
}