import { Game, Card, Stack } from './internal';

export class Tableau extends Stack {
    static yOffset;

    push(card, index = 'down') {
        const position = { ...this._position };

        if (index === 'up') {
            const topCard = this.top('up');

            if (topCard) {
                const sign = card.yFlipped ? -1 : 1;
                position.y = topCard.position.y + (sign * Tableau.yOffset);

                if (this._playerType === Game.playerTypes.OPPONENT) {
                    this._position.y += (sign * Tableau.yOffset);
                }
                this._height += Tableau.yOffset; // Grow hitbox height
            }
        }
        
        card.position = position;

        this[index].push(card);
    }

    /**
     * Gets called when dragged cards are dropped
     */
    reset() {
        this._position = { ...this.originalPosition };
        const position = { ...this.originalPosition };
        
        for (let i = 0; i < this.up.length; i++) {
            this.up[i].position.x = position.x;
            const sign = this.up[i].yFlipped ? -1 : 1;
            this.up[i].position.y = position.y + (i * sign * Tableau.yOffset);
        }

        // Set hitbox height
        let height = Card.height;
        if (this.up.length > 0) {
            const yDelta = ((this.up.length-1) * Tableau.yOffset);
            height += yDelta;
            const sign = this._playerType === Game.playerTypes.OPPONENT ? -1 : 1;
            this._position.y += (sign * yDelta);
        }
        this._height = height;

        if (this.up.length <= 0) {
            this.flip();
        }
    }

    isValidDrop(card) {
        const validEmptyDropRank = Game.ranks.KING;
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === validEmptyDropRank) {
            return true;
        }

        const topCard = this.top('up');
        if (topCard) {
            return (topCard.suit < Game.suits.CLUBS !== card.suit < Game.suits.CLUBS) && (topCard.rank - 1 === card.rank);
        }
        
        return false;
    }

    static createFromObject(object) {
        const { position: { x, y }, originalPosition, width, height, up, down, playerType } = object;
        const tableau = new Tableau(x, y, width, height, playerType);
        tableau.originalPosition = originalPosition;
        for (let j = 0; j < up.length; j++) {
            const { suit, rank, position, yFlipped } = up[j];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            tableau.up.push(card);      // Don't use Stack push function since positions are already adjusted
        }
        for (let j = 0; j < down.length; j++) {
            const { suit, rank, position, yFlipped } = down[j];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            tableau.down.push(card);    // Don't use Stack push function since positions are already adjusted
        }

        return tableau;
    }
}