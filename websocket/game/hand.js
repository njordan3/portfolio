import { Dimensions, getPlayerTypeDimensions } from "./dimensions.js";
import Stack from "./stack.js";


export default class Hand extends Stack {
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
        const { cardXOffset } = Dimensions.getInstance();
        const { handUpX, handUpY } = getPlayerTypeDimensions(this._playerType);
        let x = handUpX;
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
}