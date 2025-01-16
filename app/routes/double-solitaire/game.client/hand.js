import { SingleplayerGame } from './singleplayer-game';
import { Card, Game, Stack } from './internal';
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
        if (this.down.length <= 0 && this.up.length > 0) {
            const length = this.up.length;
            for (let i = 0; i < length; i++) {
                this.push(this.up.pop(), 'down');
            }
            return true;
        }

        return false;
    }

    reset() {
        this.highlightIndex = null;

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

    renderForeground(context) {
        if (this.highlightDownEmpty) {
            context.fillStyle = 'rgb(98 196 255 / 50%)';
            context.fillRect(this.position.x - Card.highlightWidth, this.position.y - Card.highlightWidth, Card.width + (Card.highlightWidth * 2), Card.height + (Card.highlightWidth * 2));
        }

        if (this.top('down')) {
            context.drawImage(Game.cardBackImage.canvas, this.position.x, this.position.y);
        }
        
        /**
         * If not hovering then cards are drawn as normal.
         * If hovering:
         *  - Draw the cards before the hovered card first.
         *  - Draw the border before the proceding cards.
         *  - Draw the rest of the cards.
         */
        const { up } = this;
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

    isPointIntersectBlock(x, y) {
        const { position } = this;
        const { handWidth } = Game.dimensions;
        // Block width changes depending on whether the hand has up cards
        const width = this.up.length > 0 ? handWidth : Card.width;
        const xOffset = this._playerType === Game.playerTypes.OPPONENT && this.up.length > 0 ? -(handWidth - Card.width) : 0;

        return (
            x >= position.x + xOffset && x <= position.x + width + xOffset &&
            y >= position.y && y <= position.y + Card.height
        );
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