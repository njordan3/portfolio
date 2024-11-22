import { Ranks } from './constants';
import Stack from './stack';

export default class Foundations extends Stack {
    #validEmptyDropRank = Ranks.ACE;

    isValidDrop(card) {
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === this.#validEmptyDropRank) {
            return true;
        }

        const topCard = this.top('up');
        if (topCard) {
            const topCardValue = topCard.rank === Ranks.ACE ? -1 : topCard.rank;
            return (topCard.suit === card.suit) && (topCardValue + 1 === card.rank);
        }
        
        return false;
    }
}