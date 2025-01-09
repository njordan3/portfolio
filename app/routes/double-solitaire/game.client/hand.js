import { SingleplayerGame } from './singleplayer-game';
import { Card, Stack } from './internal';
import { MultiplayerGame } from './multiplayer-game';

export class Hand extends Stack {
    static xOffset;
    static dealAmount = 3;

    #upX = 0;
    #upY = 0;

    constructor(x, y, width, height, playerType = null) {
        super(x, y, width, height, playerType);
        const { handUpX, handUpY } = this._playerType !== null
            ? MultiplayerGame.getDimensions(playerType)
            : SingleplayerGame.getDimensions();
        
        this.#upX = handUpX;
        this.#upY = handUpY;
    }

    flip() {
        for (let i = 0; i < Hand.dealAmount; i++) {
            const card = this.down.pop();
            if (card) {
                this.push(card, 'up');
            }
        }

        this.reset();
    }

    restart() {
        if (this.down.length <= 0) {
            const length = this.up.length;
            for (let i = 0; i < length; i++) {
                this.push(this.up.pop(), 'down');
            }
            return true;
        }

        return false;
    }

    reset() {
        let x = this.#upX;
        const indexClamp = (this.up.length > Hand.dealAmount ? this.up.length - Hand.dealAmount : 0);
        for (let i = 0; i < this.up.length; i++) {
            const sign = this.up[i].yFlipped ? -1 : 1;
            if (i > indexClamp) {
                x += (sign * Hand.xOffset);
            }
            
            this.up[i].position = {
                x,
                y: this.#upY
            }
        }
    }

    static createFromObject(object) {
        const { position: { x, y }, width, height, up, down, playerType } = object;
        const hand = new Hand(x, y, width, height, playerType);
        for (let i = 0; i < up.length; i++) {
            const { suit, rank, position, yFlipped } = up[i];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            hand.up.push(card);     // Don't use Stack push function since positions are already adjusted
        }
        for (let i = 0; i < down.length; i++) {
            const { suit, rank, position, yFlipped } = down[i];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            hand.down.push(card);   // Don't use Stack push function since positions are already adjusted
        }

        hand.reset();

        return hand;
    }
}