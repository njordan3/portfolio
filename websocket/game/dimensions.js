import { PlayerType } from "./internal.js";

export class Dimensions {
    boardWidth = 2000;
    centerX = 1000;
    
    cardWidth = 81;
    cardXOffset = 25;

    cardHeight = 117.4;
    cardYOffset = 35;

    stackGap = 20;
    cardMargin = 5;

    static _instance;

    static getInstance() {
      if (!this._instance) {
          this._instance = new Dimensions();
      }

      return this._instance;
    }

    constructor() {
        if (this._instance) {
            throw Error('Dimensions already initialized');
        }

        this.calcHeight();
        this.calcFoundation();

        this.tableauX = this.centerX - (this.cardWidth * 3.5) - (this.stackGap * 3);
        this.tableauY = this.foundationY + this.cardHeight + this.stackGap;
        this.tableauWidth = (this.cardWidth * 7) + (this.stackGap * 6);

        this.handDownX = this.tableauX - (this.cardWidth * 2) - (this.stackGap * 2) - (this.cardXOffset * 2);
        this.handDownY = this.tableauY + this.cardHeight + this.stackGap;

        this.handUpX = this.handDownX + this.cardWidth + this.stackGap;
        this.handUpY = this.handDownY;
        this.handWidth = (this.cardWidth * 2) + this.stackGap + (this.cardXOffset * 2);

        this.startX = this.centerX;
        this.startY = this.tableauY;
    }

    calcHeight() {
        this.boardHeight = 1000;
        this.centerY = this.boardHeight/2;
    }
    
    calcFoundation() {
        this.foundationX = this.centerX - (this.cardWidth * 2) - (this.stackGap * 1.5);
        this.foundationY = 1.5 * this.cardHeight;
        this.foundationWidth = (this.cardWidth * 4) + (this.stackGap * 3);
    }

    toJSON() {
        return {
            boardWidth: this.boardWidth,
            boardHeight: this.boardHeight,
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            stackGap: this.stackGap,
            cardMargin: this.cardMargin,
            cardXOffset: this.cardXOffset,
            cardYOffset: this.cardYOffset,
            centerX: this.centerX,
            centerY: this.centerY,
            tableauX: this.tableauX,
            tableauY: this.tableauY,
            tableauWidth: this.tableauWidth,
            handDownX: this.handDownX,
            handDownY: this.handDownY,
            handUpX: this.handUpX,
            handUpY: this.handUpY,
            handWidth: this.handWidth,
            foundationX: this.foundationX,
            foundationY: this.foundationY,
            foundationWidth: this.foundationWidth,
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
        if (!this._instance) {
            this._instance = new MultiplayerDimensions();
        }
  
        return this._instance;
      }

    constructor() {
        super();

        if (this._instance) {
            throw Error('MultiplayerDimensions already initialized');
        }
        
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

        const tableauX = this.centerX - (this.cardWidth * 3.5) - (this.stackGap * 3);
        const tableauY = this.foundationY - this.cardHeight - this.stackGap;

        const handDownX = tableauX + (this.cardWidth * 8) + (this.stackGap * 8) + (this.cardXOffset * 2);
        const handDownY = tableauY - this.cardHeight - this.stackGap;

        const handUpX = handDownX - this.cardWidth - this.stackGap;
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
        this.foundationX = this.centerX - (this.cardWidth * 4) - (this.stackGap * 3);
        this.foundationY = this.centerY - (this.cardHeight/2);
        this.foundationWidth = (this.cardWidth * 8) + (this.stackGap * 7);
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
    const { owner, opponent, ...rest } = MultiplayerDimensions.getInstance().toJSON();
    if (playerType === PlayerType.OPPONENT) {
        return {
            ...rest,
            ...opponent,
            startX: opponent.startX,
            startY: opponent.startY
        };
    }

    return {
        ...rest,
        ...owner,
        startX: -owner.startX,
        startY: -owner.startY
    };
}