import { PlayerType } from "./constants.js";

export class Dimensions {
    boardWidth = 2000;
    centerX = 1000;
    
    cardWidth = 81;
    cardXOffset = 25;

    cardHeight = 117;
    cardYOffset = 40;

    cardGap = 20;
    cardMargin = 5;

    static $instance;

    static getInstance() {
      if (!this.$instance) {
          this.$instance = new Dimensions();
      }

      return this.$instance;
    }

    constructor() {
        if (!this.$instance) {
            this.calcHeight();
            this.calcFoundation();

            this.tableauX = this.centerX - (this.cardWidth * 3.5) - (this.cardGap * 3);
            this.tableauY = this.foundationY + this.cardHeight + this.cardGap;

            this.handDownX = this.tableauX - (this.cardWidth * 2) - (this.cardGap * 2) - (this.cardXOffset * 2);
            this.handDownY = this.tableauY + this.cardHeight + this.cardGap;

            this.handUpX = this.handDownX + this.cardWidth + this.cardGap;
            this.handUpY = this.handDownY;

            this.startX = this.centerX;
            this.startY = this.tableauY;
        }
    }

    calcHeight() {
        this.boardHeight = 1000;
        this.centerY = this.boardHeight/2;
    }
    
    calcFoundation() {
        this.foundationX = this.centerX - (this.cardWidth * 2) - (this.cardGap * 1.5);
        this.foundationY = 1.5 * this.cardHeight;
    }

    toJSON() {
        return {
            boardWidth: this.boardWidth,
            boardHeight: this.boardHeight,
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            cardGap: this.cardGap,
            cardMargin: this.cardMargin,
            cardXOffset: this.cardXOffset,
            cardYOffset: this.cardYOffset,
            centerX: this.centerX,
            centerY: this.centerY,
            tableauX: this.tableauX,
            tableauY: this.tableauY,
            handDownX: this.handDownX,
            handDownY: this.handDownY,
            handUpX: this.handUpX,
            handUpY: this.handUpY,
            foundationX: this.foundationX,
            foundationY: this.foundationY,
            startX: this.startX,
            startY: this.startY
        }
    }
}

export class MultiplayerDimensions extends Dimensions {
    opponent = {
        tableauX: 0,
        tableauY: 0,
        handDownX: 0,
        handDownY: 0,
        handUpX: 0,
        handUpY: 0,
        startX: 0,
        startY: 0,
    };

    owner = {
        tableauX: 0,
        tableauY: 0,
        handDownX: 0,
        handDownY: 0,
        handUpX: 0,
        handUpY: 0,
        startX: 0,
        startY: 0,
    };

    static getInstance() {
        if (!this.$instance) {
            this.$instance = new MultiplayerDimensions();
        }
  
        return this.$instance;
      }

    constructor() {
        super();

        this.owner = {
            tableauX: this.tableauX,
            tableauY: this.tableauY,
            handDownX: this.handDownX,
            handDownY: this.handDownY,
            handUpX: this.handUpX,
            handUpY: this.handUpY,
            startX: this.startX,
            startY: this.startY,
        };

        const tableauX = this.centerX - (this.cardWidth * 3.5) - (this.cardGap * 3);
        const tableauY = this.foundationY - this.cardHeight - this.cardGap;

        const handDownX = tableauX + (this.cardWidth * 8) + (this.cardGap * 8) + (this.cardXOffset * 2);
        const handDownY = tableauY - this.cardHeight - this.cardGap;

        const handUpX = handDownX - this.cardWidth - this.cardGap;
        const handUpY = handDownY;

        const startX = this.centerX;
        const startY = tableauY;

        this.opponent = {
            tableauX,
            tableauY,
            handDownX,
            handDownY,
            handUpX,
            handUpY,
            startX,
            startY,
        };
    }
    calcHeight() {
        this.boardHeight = 1500;
        this.centerY = this.boardHeight/2;
    }

    calcFoundation() {
        this.foundationX = this.centerX - (this.cardWidth * 4) - (this.cardGap * 3);
        this.foundationY = this.centerY - (this.cardHeight/2);
    }

    toJSON() {
        const {
            tableauX,
            tableauY,
            handDownX,
            handDownY,
            handUpX,
            handUpY,
            startX,
            startY,
            ...rest
        } = super.toJSON();

        return {
            ...rest,
            owner: {
                tableauX,
                tableauY,
                handDownX,
                handDownY,
                handUpX,
                handUpY,
                startX,
                startY,
            },
            opponent: this.opponent
        };
    }
}

export function getPlayerTypeDimensions(playerType) {
    const dimensions = MultiplayerDimensions.getInstance();
    // If cards are being dealt and we are not the owner, then assume we are opponent and not spectator.
    return playerType === PlayerType.OWNER ? dimensions.owner : dimensions.opponent;
}