import { generateRandomInt } from '@/utils/misc';
import { Game, Camera, Card, Hand, Tableau, Foundations } from './internal';

export class SingleplayerGame extends Game {
    constructor() {
        super();

        if (this._instance) {
            throw Error('Singleplayer Game already initialized');
        }
        
        const existingGame = localStorage.getItem('singleplayerGame');
        if (existingGame) {
            try {
                const { hand, tableau, foundations } = JSON.parse(existingGame);
                const { stackGap, handDownX, handDownY, tableauX, tableauY, foundationX, foundationY } = SingleplayerGame.dimensions;
                
                this.hand = new Hand(handDownX, handDownY, Card.width, Card.height);
                for (let i = 0; i < hand.up.length; i++) {
                    const { suit, rank } = hand.up[i];
                    this.hand.push(new Card(suit, rank), 'up');
                }
                for (let i = 0; i < hand.down.length; i++) {
                    const { suit, rank } = hand.down[i];
                    this.hand.push(new Card(suit, rank), 'down');
                }
                this.hand.reset();

                this.tableau = Array.from({ length: 7 }, (e, i) => {
                    const x = tableauX + ((Card.width + stackGap) * i);
                    const y = tableauY;
                    const newTableau = new Tableau(x, y, Card.width, Card.height);
                    for (let j = 0; j < tableau[i].up.length; j++) {
                        const { suit, rank } = tableau[i].up[j];
                        newTableau.push(new Card(suit, rank), 'up');
                    }
                    for (let j = 0; j < tableau[i].down.length; j++) {
                        const { suit, rank } = tableau[i].down[j];
                        newTableau.push(new Card(suit, rank), 'down');
                    }

                    return newTableau;
                });
                
                this.foundations = Array.from({ length: 4 }, (e, i) => {
                    const x = foundationX + ((Card.width + stackGap) * i);
                    const y = foundationY;
                    const newFoundation = new Foundations(x, y, Card.width, Card.height);
                    for (let j = 0; j < foundations[i].up.length; j++) { // Foundations only have up cards
                        const { suit, rank } = foundations[i].up[j];
                        newFoundation.push(new Card(suit, rank), 'up');
                    }

                    return newFoundation;
                });
            } catch (e) {
                console.error('Error restoring singleplayer game', e);
                this.deal();
            }
        } else {
            this.deal();
        }
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new SingleplayerGame();
        }

        return this._instance;
    }
    
    
    callGetDimensions(playerType = null) {
        return SingleplayerGame.getDimensions(playerType);
    }

    static getDimensions(playerType = null) {
        return {
            ...SingleplayerGame.dimensions,
            startX: -SingleplayerGame.dimensions.startX,
            startY: -SingleplayerGame.dimensions.startY
        };
    }

    reset() {
        const { stackGap, handDownX, handDownY, tableauX, tableauY, foundationX, foundationY } = SingleplayerGame.dimensions;

        this.hand = new Hand(handDownX, handDownY, Card.width, Card.height);

        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 0; rank < 13; rank++) {
                this.hand.push(new Card(suit, rank));
            }
        }

        this.tableau = Array.from({ length: 7 }, (e, i) => {
            const x = tableauX + ((Card.width + stackGap) * i);
            const y = tableauY;
            return new Tableau(x, y, Card.width, Card.height);
        });
        this.foundations = Array.from({ length: 4 }, (e, i) => {
            const x = foundationX + ((Card.width + stackGap) * i);
            const y = foundationY;
            return new Foundations(x, y, Card.width, Card.height);
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

        Camera.getInstance().forceUpdate();
    }

    save() {
        // localStorage.setItem('singleplayerGame', JSON.stringify({
        //     tableau: this.tableau,
        //     foundations: this.foundations,
        //     hand: this.hand,
        // }));
    }
}