import { Ranks, Stack } from './internal.js';

export class Foundations extends Stack {
    isValidDrop(card) {
        const validEmptyDropRank = Ranks.ACE;
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === validEmptyDropRank) {
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