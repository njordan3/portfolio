import { PlayerType, Ranks, Suits, Stack, Card, MultiplayerDimensions} from "./internal.js";

export class Tableau extends Stack {
    static yOffset;

    push(card, index = 'down') {
        const position = { ...this._position };

        if (index === 'up') {
            const topCard = this.top('up');

            if (topCard) {
                const sign = card.yFlipped ? -1 : 1;
                position.y = topCard.position.y + (sign * Tableau.yOffset);
                if (this._playerType === PlayerType.OPPONENT) {
                    this._position.y -= Tableau.yOffset;
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
        console.log('tableau reset')
        this._position = { ...this._originalPosition };
        const position = { ...this._originalPosition };

        for (let i = 0; i < this.up.length; i++) {
            this.up[i].position.x = position.x;
            const sign = this.up[i].yFlipped ? -1 : 1;
            this.up[i].position.y = position.y + (i * sign * Tableau.yOffset);
        }

        // Set hitbox height
        let height = Card.height;
        console.log(Card.height, Tableau.yOffset);
        if (this.up.length > 0) {
            const yDelta = ((this.up.length-1) * Tableau.yOffset);
            height += yDelta;
            const sign = this._playerType === PlayerType.OPPONENT ? -1 : 1;
            this._position.y += (sign * yDelta);
        }
        this._height = height;

        if (this.up.length <= 0) {
            this.flip();
        }
    }

    isValidDrop(card) {
        const validEmptyDropRank = Ranks.KING;
        if (this.up.length <= 0 && this.down.length <= 0 && card.rank === validEmptyDropRank) {
            return true;
        }

        const topCard = this.top('up');
        if (topCard) {
            return (topCard.suit < Suits.CLUBS !== card.suit < Suits.CLUBS) && (topCard.rank - 1 === card.rank);
        }
        
        return false;
    }
}

Tableau.yOffset = MultiplayerDimensions.getInstance().cardYOffset;