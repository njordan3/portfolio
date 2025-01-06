import { GameController } from './game-controller';
import { SingleplayerGame } from './singleplayer-game';
import { Game, Card, Stack } from './internal';

export class Tableau extends Stack {
    push(card, index = 'down') {
        // Prevents infinite singleplayer initialization
        const { cardYOffset } = GameController.isMultiplayer()
            ? GameController.getGame().getDimensions()
            : SingleplayerGame.dimensions;
        const position = {
            x: this._position.x,
            y: this._position.y
        };

        if (index === 'up') {
            const topCard = this.top('up');

            if (topCard) {
                const sign = card.yFlipped ? -1 : 1;
                position.y = topCard.position.y + (sign * cardYOffset);
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
        // Prevents infinite singleplayer initialization
        const { cardHeight, cardYOffset } = GameController.isMultiplayer()
            ? GameController.getGame().getDimensions()
            : SingleplayerGame.dimensions;
        const position = {
            x: this._position.x,
            y: this._position.y
        };

        for (let i = 0; i < this.up.length; i++) {
            this.up[i].position.x = position.x;
            const sign = this.up[i].yFlipped ? -1 : 1;
            this.up[i].position.y = position.y + (i * sign * cardYOffset);
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
        const { position: { x, y }, width, height, up, down } = object;
        const tableau = new Tableau(x, y, width, height);
        for (let j = 0; j < up.length; j++) { // Foundations only have up cards
            const { suit, rank, position, yFlipped } = up[j];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            tableau.push(card, 'up');
        }
        for (let j = 0; j < down.length; j++) {
            const { suit, rank, position, yFlipped } = down[j];
            const card = new Card(suit, rank, yFlipped);
            card.position = position;
            tableau.push(card, 'down');
        }

        return tableau;
    }
}