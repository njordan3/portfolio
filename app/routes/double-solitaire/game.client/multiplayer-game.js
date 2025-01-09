import { Camera, Game, Tableau, Hand, Foundations } from './internal';
import io from 'socket.io-client';
import { GameController } from './game-controller';

export class MultiplayerGame extends Game {
    static #socket = io({
        autoConnect: false,
    });

    static #eventCallbacks = {};

    #username = '';
    get username() {
        return this.#username;
    }
    set username(username) {
        this.#username = username;
        localStorage.setItem('username', username);
    }

    #owner;
    get owner() {
        return this.#owner;
    }
    #opponent;
    get opponent() {
        return this.#opponent;
    }
    #spectators = {};
    get spectators() {
        return this.#spectators;
    }

    constructor() {
        super();

        if (this._instance) {
            throw Error('Multiplayer Game already initialized');
        }

        const existingSessionId = localStorage.getItem('sessionId');
        if (existingSessionId) {
            MultiplayerGame.#socket.auth = { sessionId: existingSessionId };
        }

        MultiplayerGame.#socket.on('connect', (data) => {
            console.log('connect', data);
            MultiplayerGame.#doEvent('connect', data);
        });

        MultiplayerGame.#socket.on('disconnect', (data) => {
            console.log('disconnect', data);
            MultiplayerGame.#doEvent('disconnect', data);
        });

        MultiplayerGame.#socket.on('error', (data) => {
            console.log('error', data);
            MultiplayerGame.#doEvent('error', data);
        });

        MultiplayerGame.#socket.on('update-game-browser', (data) => {
            console.log('update-game-browser', data);
            MultiplayerGame.#doEvent('update-game-browser', data);
        });

        MultiplayerGame.#socket.on('game-state', (data) => {
            console.log('game-state', data);
            MultiplayerGame.#doEvent('game-state', data);
        });

        MultiplayerGame.#socket.on('game-end', (data) => {
            console.log('game-end', data);
            this.cleanGame();
            MultiplayerGame.#doEvent('game-end', data);
        });

        MultiplayerGame.#socket.on('user-joined', (data) => {
            console.log('user-joined', data);
            this.#spectators[data.id] = data;
            MultiplayerGame.#doEvent('user-joined', data);
        });

        MultiplayerGame.#socket.on('user-left', (data) => {
            console.log('user-left', data);
            delete this.#spectators[data.id];
            MultiplayerGame.#doEvent('user-left', data);
        });

        MultiplayerGame.#socket.on('player-joined', (data) => {
            console.log('player-joined', data);
            this.#opponent = data;
            this.#opponent.hand = Hand.createFromObject(data.hand);
            this.#opponent.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(data.tableau[i]));
            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-joined', data);
        });

        MultiplayerGame.#socket.on('player-left', (data) => {
            console.log('player-left', data);
            this.#opponent = undefined;
            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-left');
        });

        MultiplayerGame.#socket.on('player-update', (data) => {
            console.log('player-update', data);
            const { id, ...rest } = data;
            if (this.isOwner(id)) {
                this.#owner = {
                    ...this.#owner,
                    ...rest,
                };

                MultiplayerGame.#doEvent('owner-update', rest);
            } else if (this.isOpponent(id)) {
                this.#opponent = {
                    ...this.#opponent,
                    ...rest,
                };
                
                MultiplayerGame.#doEvent('opponent-update', rest);
            }
        });

        MultiplayerGame.#socket.on('game-start', (data) => {
            console.log('game-start', data);
            MultiplayerGame.#doEvent('game-start', data);
        });

        MultiplayerGame.#socket.on('game-start-timer', (data) => {  
            console.log('game-start-timer', data);
            MultiplayerGame.#doEvent('game-start-timer', data);
        });

        MultiplayerGame.#socket.on('player-hand-flip', (data) => {
            console.log('player-hand-flip', data);
            const { id } = data;
            let hand = null;
            if (this.isOwner(id)) {
                hand = this.#owner.hand;
            } else if (this.isOpponent(id)) {
                hand = this.#opponent.hand;
            }

            if (hand && !hand.restart() ) {
                hand.flip();
            }

            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-hand-flip', data);
        });

        MultiplayerGame.#socket.on('player-card-drag-start', (data) => {
            console.log('player-card-drag-start', data);
            const { id, draggingCardsData } = data;
            if (this.isSpectator(id)) {
                return;
            }

            const { stackIndex, cards } = draggingCardsData;
            const isOwner = this.isOwner(id);

            if (isOwner) {
                draggingCardsData.stack = this._getObjectAtIndex(stackIndex, this.#owner);
                this.#owner.draggingCardsData = draggingCardsData;
            } else {
                draggingCardsData.stack = this._getObjectAtIndex(stackIndex, this.#opponent);
                this.#opponent.draggingCardsData = draggingCardsData;
            }

            if (draggingCardsData.stack) {
                for (let i = cards.length-1; i >= 0; i--) {
                    const index = [...stackIndex, 'up', cards[i].index];
                    const card = isOwner ? this._getObjectAtIndex(index, this.#owner) : this._getObjectAtIndex(index, this.#opponent);
                    if (!card) {
                        // fetch data from server?
                        break;
                    }
                    card.isDragging = true;
                    draggingCardsData.cards[i].card = card;
                }
            }
        });

        MultiplayerGame.#socket.on('player-card-drag', (data) => {
            console.log('player-card-drag', data);
            const { id, position } = data;
            if (this.isSpectator(id)) {
                return;
            }

            const draggingCardsData = this.isOwner(id) ? this.#owner.draggingCardsData : this.#opponent.draggingCardsData;
            if (draggingCardsData) {
                const { cards } = draggingCardsData;
                const { x, y } = position;
                for (let i = 0; i < cards.length; i++) {
                    cards[i].card.targetPosition = {
                        x: x - cards[i].dragOffset.x,
                        y: y - cards[i].dragOffset.y
                    };
                    // cards[i].card.position.x = x - cards[i].dragOffset.x;
                    // cards[i].card.position.y = y - cards[i].dragOffset.y;
                }
            }

            Camera.getInstance().forceUpdate();
        });

        MultiplayerGame.#socket.on('player-card-drop', (data) => {
            console.log('player-card-drop', data);
            const { id, targetStackIndex, draggingCardsData } = data;
            if (this.isSpectator(id)) {
                return;
            }

            const isOwner = this.isOwner(id);
            if (targetStackIndex && draggingCardsData) {
                const { stackIndex, cards } = draggingCardsData;
                let targetStack = null;
                let sourceStack = null;

                if (isOwner) {
                    targetStack = this._getObjectAtIndex(targetStackIndex, this.#owner);
                    sourceStack = this._getObjectAtIndex(stackIndex, this.#owner);
                } else {
                    targetStack = this._getObjectAtIndex(targetStackIndex, this.#opponent);
                    sourceStack = this._getObjectAtIndex(stackIndex, this.#opponent);
                }

                if (targetStack && sourceStack) {
                    for (let i = cards.length-1; i >= 0; i--) {
                        const index = [...stackIndex, 'up', cards[i].index];
                        const card = isOwner ? this._getObjectAtIndex(index, this.#owner) : this._getObjectAtIndex(index, this.#opponent);
                        if (!card) {
                            // fetch data from server?
                            break;
                        }

                        targetStack.push(card, 'up');
                    }

                    for (let i = 0; i < cards.length; i++) {
                        sourceStack.up.pop();
                    }
                    
                    sourceStack.reset();
                }
            }

            // Reset saved dragging cards data
            if (isOwner && this.#owner.draggingCardsData) {
                this.#owner.draggingCardsData.stack.reset();
                for (let i = 0; i < this.#owner.draggingCardsData.cards.length; i++) {
                    this.#owner.draggingCardsData.cards[i].card.isDragging = false;
                    this.#owner.draggingCardsData.cards[i].targetPosition = undefined;
                }
        
                this.#owner.draggingCardsData = null;
            } else if (!isOwner && this.#opponent.draggingCardsData) {
                this.#opponent.draggingCardsData.stack.reset();
                for (let i = 0; i < this.#opponent.draggingCardsData.cards.length; i++) {
                    this.#opponent.draggingCardsData.cards[i].card.isDragging = false;
                    this.#opponent.draggingCardsData.cards[i].targetPosition = undefined;
                }
        
                this.#opponent.draggingCardsData = null;
            }

            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-card-drop', data);
        });

        MultiplayerGame.#socket.on('session', (data) => {
            console.log('session', data);
            const { sessionId, userId, game } = data;
            MultiplayerGame.#socket.auth = { sessionId };
            localStorage.setItem('sessionId', sessionId);
            MultiplayerGame.#socket.userId = userId;

            if (game) {
                if (game.owner) {
                    this.#owner = game.owner;
                    this.#owner.hand = Hand.createFromObject(game.owner.hand);
                    this.#owner.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.owner.tableau[i]));
                }

                if (game.opponent) {
                    this.#opponent = game.opponent;
                    this.#opponent.hand = Hand.createFromObject(game.opponent.hand);
                    this.#opponent.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.opponent.tableau[i]));
                }

                if (game.spectators) {
                    this.#spectators = game.spectators;
                }

                if (this.isOwner(userId)) {
                    this.hand = this.#owner.hand;
                    this.tableau = this.#owner.tableau;
                    data.userReady = game.owner?.ready;
                    data.userDone = game.owner?.done;
                } else if (this.isOpponent(userId)) {
                    this.hand = this.#opponent.hand;
                    this.tableau = this.#opponent.tableau;
                    data.userReady = game.opponent?.ready;
                    data.userDone = game.opponent?.done;
                    Camera.getInstance().rotation = Math.PI;
                }
                
                this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));
                GameController.setIsMultiplayer(true);
                Camera.getInstance().recenter();
            }

            MultiplayerGame.#doEvent('session', data);
        });
    }

    static on(event, callback) {
        MultiplayerGame.#eventCallbacks[event] = callback;
    }

    static #doEvent(event, ...args) {
        if (MultiplayerGame.#eventCallbacks[event]) {
            MultiplayerGame.#eventCallbacks[event](...args);
        }
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new MultiplayerGame();
        }

        return this._instance;
    }

    callGetDimensions(playerType = null) {
        return MultiplayerGame.getDimensions(playerType);
    }

    static getDimensions(playerType = null) {
        const { owner, opponent, ...rest } = MultiplayerGame.dimensions;
        if (playerType === Game.playerTypes.OPPONENT) {
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

    renderForeground() {
        const camera = Camera.getInstance();
        const { foreground } = camera.contexts;

        const deckRenders = [];
        if (this.isOwner() && this.#opponent) {
            deckRenders.push(this.#opponent);
        } else if (this.isOpponent() && this.#owner) {
            deckRenders.push(this.#owner);
        } else {
            if (this.#owner) {
                deckRenders.push(this.#owner);
            }
            if (this.#opponent) {
                deckRenders.push(this.#opponent);
            }
        }

        for (let i = 0; i < deckRenders.length; i++) {
            const { tableau, hand } = deckRenders[i];

            if (hand.top('down')) {
                foreground.drawImage(Game.cardBackImage.canvas, hand.position.x, hand.position.y);
            }
    
            const draggingCards = [];
    
            // Render only last 3 of hand up
            const indexClamp = (hand.up.length > Hand.dealAmount ? hand.up.length - Hand.dealAmount : 0);
            for (let j = indexClamp; j < hand.up.length; j++) {
                const { isDragging } = hand.up[j];
                if (isDragging) {
                    draggingCards.push(hand.up[j]);
                    continue;
                }
    
                hand.up[j].draw(foreground);
            }
            
            for (let j = 0; j < tableau.length; j++) {
                if (tableau[j].down.length > 0) {
                    const downCard = tableau[j].down[0];
                    foreground.drawImage(Game.cardBackImage.canvas, downCard.position.x, downCard.position.y);
                }
    
                for (let k = 0; k < tableau[j].up.length; k++) {
                    const { isDragging } = tableau[j].up[k];
                    if (isDragging) {
                        draggingCards.push(tableau[j].up[k]);
                        continue;
                    }
    
                    tableau[j].up[k].draw(foreground);
                }
            }
    
            // Render dragging cards last so they appear on top
            for (let j = 0; j < draggingCards.length; j++) {
                if (draggingCards[j].targetPosition) {
                    draggingCards[j].targetPosition;
                    draggingCards[j].position.x += (draggingCards[j].targetPosition.x - draggingCards[j].position.x) * 0.10;
                    draggingCards[j].position.y += (draggingCards[j].targetPosition.y - draggingCards[j].position.y) * 0.10;
                    Camera.getInstance().forceUpdate();
                }

                draggingCards[j].draw(foreground);
            }
            
        }

        super.renderForeground();
    }

    renderBackground() {
        super.renderBackground();

        const camera = Camera.getInstance();
        const { background } = camera.contexts;

        const deckRenders = [];
        if (this.isOwner() && this.#opponent) {
            deckRenders.push(this.#opponent);
        } else if (this.isOpponent() && this.#owner) {
            deckRenders.push(this.#owner);
        } else {
            if (this.#owner) {
                deckRenders.push(this.#owner);
            }
            if (this.#opponent) {
                deckRenders.push(this.#opponent);
            }
        }

        for (let i = 0; i < deckRenders.length; i++) {
            const { tableau, hand } = deckRenders[i];

            for (let j = 0; j < tableau.length; j++) {
                tableau[j].renderBackground(background);
            }

            hand.renderBackground(background);
        }
    }

    connect() {
        MultiplayerGame.#socket.connect();
    }

    disconnect() {
        MultiplayerGame.#socket.disconnect();
    }

    isServerConnected() {
        return MultiplayerGame.#socket.connected;
    }

    isOwner(userId = null) {
        const id = userId ? userId : MultiplayerGame.#socket.userId;
        return id === (this.#owner?.id ?? null);
    }

    isOpponent(userId = null) {
        const id = userId ? userId : MultiplayerGame.#socket.userId;
        return id === (this.#opponent?.id ?? null);
    }

    isSpectator() {
        if (this.#spectators) {
            for (const spectator in this.#spectators) {
                if (MultiplayerGame.#socket.userId === spectator) {
                    return true;
                }
            }
        }

        return false;
    }

    async createGame(name) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId) {
            try {
                const { success, code, events, game } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('create-game', { name, username: this.#username });
                console.log('create-game', { success, code, events, game });
                if (success) {
                    this.#owner = game.owner;

                    this.hand = this.#owner.hand = Hand.createFromObject(game.owner.hand);
                    this.tableau = this.#owner.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.owner.tableau[i]));
                    this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));

                    GameController.setIsMultiplayer(true);
                    Camera.getInstance().recenter();
                    MultiplayerGame.#doEvent('create-game');
                }
            } catch (e) {
                // the server did not acknowledge the event
            }
        }
         
        return false;
    }

    async joinGame(gameId) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId) {
            try {
                const { success, code, events, game } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('join-game', { gameId, username: this.#username });
                console.log('join-game', { success, code, events, game });
                if (success) {
                    if (game.owner) {
                        this.#owner = game.owner;
                        this.#owner.hand = Hand.createFromObject(game.owner.hand);
                        this.#owner.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.owner.tableau[i]));
                    }
    
                    if (game.opponent) {
                        this.#opponent = game.opponent;
                        this.#opponent.hand = Hand.createFromObject(game.opponent.hand);
                        this.#opponent.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.opponent.tableau[i]));
                    }
    
                    if (game.spectators) {
                        this.#spectators = game.spectators;
                    }

                    if (this.isOpponent(game.opponent.id)) {
                        Camera.getInstance().rotation = Math.PI;
                        this.hand = this.#opponent.hand;
                        this.tableau = this.#opponent.tableau;
                    }

                    this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));

                    GameController.setIsMultiplayer(true);
                    Camera.getInstance().recenter();
                    MultiplayerGame.#doEvent('join-game');
                }
            } catch (e) {
                // the server did not acknowledge the event
            }
        }
         
        return false;
    }

    async leaveGame() {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId) {
            try {
                const { success, events } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('leave-game');
                console.log('leave-game', { success, events });
                if (success) {
                    this.cleanGame();
                    Camera.getInstance().recenter();
                    MultiplayerGame.#doEvent('leave-game');
                }
            } catch (e) {
                // the server did not acknowledge the event
            }
        }
        
        return false;
    }
    
    async readyUp(ready) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId && this.isGameConnected()) {
            try {
                const { success, code, events } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('ready-up', { ready });
                console.log('ready-up', { success, code, events });
                if (!success) {
                    ready = !ready;
                }
            } catch (e) {
                // the server did not acknowledge the event
                ready = !ready;
            }

            if (this.isOwner()) {
                this.#owner.ready = ready;
                MultiplayerGame.#doEvent('owner-update', { ready });
            } else if (this.isOpponent()) {
                this.#opponent.ready = ready;
                MultiplayerGame.#doEvent('opponent-update', { ready });
            }
            
            MultiplayerGame.#doEvent('ready-up', ready);
        }
         
        return false;
    }

    async done(done) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId && this.isGameConnected()) {
            try {
                const { success, code, events } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('set-done', { done });
                console.log('set-done', { success, code, events });
                if (!success) {
                    done = !done;
                }
            } catch (e) {
                // the server did not acknowledge the event
                done = !done;
            }

            if (this.isOwner()) {
                this.#owner.done = done;
                MultiplayerGame.#doEvent('owner-update', { done });
            } else if (this.isOpponent()) {
                this.#opponent.done = done;
                MultiplayerGame.#doEvent('opponent-update', { done });
            }
            
            MultiplayerGame.#doEvent('set-done', done);
        }
         
        return false;
    }

    cleanGame() {
        this.#owner = undefined;
        this.#opponent = undefined;
        this.#spectators = undefined;
        this.tableau = undefined;
        this.hand = undefined;
        this.foundations = undefined;
        
        GameController.setIsMultiplayer(false);
        Camera.getInstance().rotation = 0;
    }
    
    _onCardPick(x, y) {
        console.log('pick', x, y);
        MultiplayerGame.#socket.emit('card-pick', { x, y });
    }

    // Throttle
    #cardMoveTimeout;
    _onCardMove(x, y) {
        if (!this.#cardMoveTimeout) {
            MultiplayerGame.#socket.emit('card-move', { x, y });
            this.#cardMoveTimeout = setTimeout(() => {
                this.#cardMoveTimeout = undefined;
            }, 41); // ~24 updates/s
        }
    }

    _onCardDrop(x, y) {
        console.log('drop', x, y);
        MultiplayerGame.#socket.emit('card-drop', { x, y });
    }
}
