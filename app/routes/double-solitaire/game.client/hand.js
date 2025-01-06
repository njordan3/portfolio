import { GameController } from './game-controller';
import { SingleplayerGame } from './singleplayer-game';
import { Card, Stack } from './internal';

export class Hand extends Stack {
    static dealAmount = 3;

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
        // Prevents infinite singleplayer initialization
        const { cardXOffset, handUpX, handUpY } = GameController.isMultiplayer()
            ? GameController.getGame().getDimensions()
            : SingleplayerGame.dimensions;
        let x = handUpX; // Get Multiplayer dimensions
        const indexClamp = (this.up.length > Hand.dealAmount ? this.up.length - Hand.dealAmount : 0);
        for (let i = 0; i < this.up.length; i++) {
            const sign = this.up[i].yFlipped ? -1 : 1;
            if (i > indexClamp) {
                x += (sign * cardXOffset);
            }
            this.up[i].position = {
                x,
                y: handUpY
            }
        }
    }

    static createFromObject(object) {
        const { position: { x, y }, width, height, up, down } = object;
        const hand = new Hand(x, y, width, height);
        for (let i = 0; i < up.length; i++) {
            const { suit, rank, position, yFlipped } = up[i];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            hand.push(card, 'up');
        }
        for (let i = 0; i < down.length; i++) {
            const { suit, rank, position, yFlipped } = down[i];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            hand.push(card, 'down');
        }

        return hand;
    }
}