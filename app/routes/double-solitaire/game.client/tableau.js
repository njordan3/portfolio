import { Ranks, Suits } from './constants';
import { getGame } from './game';
import Stack from './stack';

export default class Tableau extends Stack {
    #validEmptyDropRank = Ranks.KING;

    push(card, index = 'down') {
        const { cardYOffset } = getGame().dimensions;
        const position = {
            x: this._position.x,
            y: this._position.y
        };

        if (index === 'up') {
            const topCard = this.top('up');

            if (topCard) {
                position.y = topCard.position.y + cardYOffset;
                this._height += cardYOffset; // Grow hitbox height
            }
        }
        
        card.position = position;

        this[index].push(card);
    }

    /**
     * Gets called when dragged cards are dropped
     */
    reset() {
        const { cardHeight, cardYOffset } = getGame().dimensions;
        const position = {
            x: this._position.x,
            y: this._position.y
        };

        for (let i = 0; i < this.up.length; i++) {
            this.up[i].position.x = position.x;
            this.up[i].position.y = position.y + (i * cardYOffset);
        }

        // Set hitbox height
        let height = cardHeight;
        if (this.up.length > 0) {
            height += ((this.up.length-1) * cardYOffset);
        }
        this._height = height;

        if (this.up.length <= 0) {
            this.flip();
        }
    }

    isValidDrop(card) {
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === this.#validEmptyDropRank) {
            return true;
        }

        const topCard = this.top('up');
        if (topCard) {
            return (topCard.suit < Suits.CLUBS !== card.suit < Suits.CLUBS) && (topCard.rank - 1 === card.rank);
        }
        
        return false;
    }
}