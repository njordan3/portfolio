import { Game, Card, Stack } from './internal';

export class Foundations extends Stack {
    isValidDrop(card) {
        const validEmptyDropRank = Game.ranks.ACE;
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === validEmptyDropRank) {
            return true;
        }

        const topCard = this.top('up');
        if (topCard) {
            const topCardValue = topCard.rank === Game.ranks.ACE ? -1 : topCard.rank;
            return (topCard.suit === card.suit) && (topCardValue + 1 === card.rank);
        }
        
        return false;
    }

    static createFromObject(object) {
        const { position: { x, y }, width, height, up } = object;
        const foundations = new Foundations(x, y, width, height);
        for (let j = 0; j < up.length; j++) { // Foundations only have up cards
            const { suit, rank, position, yFlipped } = up[j];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            foundations.up.push(card);  // Don't use Stack push function since positions are already adjusted
        }

        return foundations;
    }
}