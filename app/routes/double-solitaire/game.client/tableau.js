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
        this.highlightIndex = null;

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
            if (this._playerType === Game.playerTypes.OPPONENT) {
                this._position.y += (-yDelta);
            }
            
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

    isPointIntersectBlock(x, y) {
        const { position } = this;
        const { tableauWidth } = Game.dimensions;

        return (
            x >= position.x && x <= position.x + tableauWidth &&
            y >= position.y && y <= position.y + Card.height
        );
    }

    renderForeground(context) {
        const { down, up } = this;
        if (down.length > 0) {
            const downCard = down[0];
            context.drawImage(Game.cardBackImage.canvas, downCard.position.x, downCard.position.y);
        } else if (up.length <= 0 && this.highlightDownEmpty) {
            context.fillStyle = 'rgb(98 196 255 / 50%)';
            context.fillRect(this.position.x - Card.highlightWidth, this.position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), Card.height + (Card.highlightWidth * 2));
        }

        /**
         * If not hovering then cards are drawn as normal.
         * If hovering:
         *  - Draw the cards before the hovered card first.
         *  - Draw the border before the proceding cards.
         *  - Draw the rest of the cards.
         */
        let beforeHighlight = up.length;
        if (this.highlightIndex !== null && this.highlightIndex-1 > 0) {
            beforeHighlight = this.highlightIndex;
        }

        for (let i = 0; i < beforeHighlight; i++) {
            const { isDragging } = up[i];
            if (isDragging) {
                continue;
            }

            up[i].draw(context);
        }

        if (this.highlightIndex !== null && up[this.highlightIndex] && !up[this.highlightIndex].isDragging) {
            const topCard = this.top('up');
            const indexCard = up[this.highlightIndex];
            const height = Card.height + Math.abs(topCard.position.y - indexCard.position.y);
            const { position } = topCard.yFlipped ? topCard : indexCard;
            
            context.fillStyle = 'rgb(98 196 255 / 50%)';
            context.fillRect(position.x - Card.highlightWidth, position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), height + (Card.highlightWidth * 2));
        
            for (let i = this.highlightIndex; i < up.length; i++) {
                const { isDragging } = up[i];
                if (isDragging) {
                    continue;
                }
    
                up[i].draw(context);
            }
        }
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