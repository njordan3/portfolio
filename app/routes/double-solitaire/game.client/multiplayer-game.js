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

    get userId() {
        return MultiplayerGame.#socket.userId;
    }

    constructor() {
        super();

        this._started = false;

        if (this._instance) {
            throw Error('Multiplayer Game already initialized');
        }

        const existingSessionId = localStorage.getItem('sessionId');
        if (existingSessionId) {
            MultiplayerGame.#socket.auth = { sessionId: existingSessionId };
        }

        MultiplayerGame.#socket.on('connect', (data) => {
            console.log('connect', data);
            MultiplayerGame.#doEvent('log', ['connected']);
            MultiplayerGame.#doEvent('connect', data);
        });

        MultiplayerGame.#socket.on('disconnect', (data) => {
            console.log('disconnect', data);
            MultiplayerGame.#doEvent('log', ['disconnected']);
            MultiplayerGame.#doEvent('disconnect', data);
        });

        MultiplayerGame.#socket.on('update-game-browser', (data) => {
            console.log('update-game-browser', data);
            MultiplayerGame.#doEvent('update-game-browser', data);
        });

        MultiplayerGame.#socket.on('game-restart', (data) => {
            console.log('game-restart', data);
            this.loadGame(data);
            const userUpdate = {
                ready: false,
                done: false,
                voteRestart: false,
            };
            this.#owner = {
                ...this.#owner,
                ...userUpdate,
            };
            this.#opponent = {
                ...this.#opponent,
                ...userUpdate,
            };

            MultiplayerGame.#doEvent('owner-update', userUpdate);
            MultiplayerGame.#doEvent('opponent-update', userUpdate);
            MultiplayerGame.#doEvent('game-restart', data);
        });

        const processGameStats = (data) => {
            let winner = null;
            Object.keys(data).map((userId) => {
                const { score } = data[userId];
                if (!winner || score > data[winner].score) {
                    winner = userId;
                } else if (data[winner].score === score) {
                    winner = null;  // tie
                }
                data[userId].me = userId === MultiplayerGame.#socket.userId;
            });

            return {
                winner,
                stats: data,
            };
        }

        MultiplayerGame.#socket.on('game-end', (data) => {
            console.log('game-end', data);
            if (Object.keys(data).length > 0) {
                data = processGameStats(data);
            }
            this.unloadGame();
            MultiplayerGame.#doEvent('game-end', data);
            MultiplayerGame.#doEvent('log', ['game-ended']);
        });
        
        MultiplayerGame.#socket.on('game-complete', (data) => {
            console.log('game-complete', data);
            
            data = processGameStats(data);
            this._started = false;
            const userUpdate = {
                ready: false,
                done: false,
                voteRestart: false,
            };
            this.#owner = {
                ...this.#owner,
                ...userUpdate,
            };
            this.#opponent = {
                ...this.#opponent,
                ...userUpdate,
            };

            MultiplayerGame.#doEvent('owner-update', userUpdate);
            MultiplayerGame.#doEvent('opponent-update', userUpdate);
            MultiplayerGame.#doEvent('game-complete', data);
            MultiplayerGame.#doEvent('log', ['game-completed']);
        });

        MultiplayerGame.#socket.on('user-joined', (data) => {
            console.log('user-joined', data);
            this.#spectators[data.id] = data;
            MultiplayerGame.#doEvent('user-joined', data);
            MultiplayerGame.#doEvent('log', ['user-joined-game']);
        });

        MultiplayerGame.#socket.on('user-left', (data) => {
            console.log('user-left', data);
            delete this.#spectators[data.id];
            MultiplayerGame.#doEvent('user-left', data);
            MultiplayerGame.#doEvent('log', ['user-left-game']);
        });

        MultiplayerGame.#socket.on('player-joined', (data) => {
            console.log('player-joined', data);
            this.#opponent = data;
            this.#opponent.hand = Hand.createFromObject(data.hand);
            this.#opponent.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(data.tableau[i]));
            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-joined', data);
            MultiplayerGame.#doEvent('log', ['player-joined-game']);
        });

        MultiplayerGame.#socket.on('player-left', (data) => {
            console.log('player-left', data);
            this.#opponent = undefined;
            Camera.getInstance().forceUpdate();
            MultiplayerGame.#doEvent('player-left');
            MultiplayerGame.#doEvent('log', ['player-left-game']);
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

        MultiplayerGame.#socket.on('game-start', () => {
            console.log('game-start');
            this._started = true;
            const userUpdate = {
                ready: false,
                done: false,
                voteRestart: false,
            };
            this.#owner = {
                ...this.#owner,
                ...userUpdate,
            };
            this.#opponent = {
                ...this.#opponent,
                ...userUpdate,
            };

            MultiplayerGame.#doEvent('owner-update', userUpdate);
            MultiplayerGame.#doEvent('opponent-update', userUpdate);
            MultiplayerGame.#doEvent('game-start');
            MultiplayerGame.#doEvent('log', ['game-started']);
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
                    // Card position gets interpolated during render based on this target render
                    cards[i].card.targetPosition = {
                        x: x - cards[i].dragOffset.x,
                        y: y - cards[i].dragOffset.y
                    };
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
                data.playerType= Game.playerTypes.SPECTATOR;
                if (game.owner) {
                    this.#owner = game.owner;
                    this.#owner.hand = Hand.createFromObject(game.owner.hand);
                    this.#owner.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.owner.tableau[i]));
                    
                    if (game.owner.draggingCardsData) {
                        const { stackIndex, cards } = game.owner.draggingCardsData;
                        this.#owner.draggingCardsData.stack = this._getObjectAtIndex(stackIndex, this.#owner);

                        if (this.#owner.draggingCardsData.stack) {
                            for (let i = cards.length-1; i >= 0; i--) {
                                const index = [...stackIndex, 'up', cards[i].index];
                                const card = this._getObjectAtIndex(index, this.#owner);
                                if (!card) {
                                    break;
                                }
                                card.isDragging = true;
                                this.#owner.draggingCardsData.cards[i].card = card;
                            }
                        }
                    }
                }

                if (game.opponent) {
                    this.#opponent = game.opponent;
                    this.#opponent.hand = Hand.createFromObject(game.opponent.hand);
                    this.#opponent.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.opponent.tableau[i]));

                    if (game.opponent.draggingCardsData) {
                        const { stackIndex, cards } = game.opponent.draggingCardsData;
                        this.#opponent.draggingCardsData.stack = this._getObjectAtIndex(stackIndex, this.#opponent);

                        if (this.#opponent.draggingCardsData.stack) {
                            for (let i = cards.length-1; i >= 0; i--) {
                                const index = [...stackIndex, 'up', cards[i].index];
                                const card = this._getObjectAtIndex(index, this.#opponent);
                                if (!card) {
                                    break;
                                }
                                card.isDragging = true;
                                this.#opponent.draggingCardsData.cards[i].card = card;
                            }
                        }
                    }
                }

                if (game.spectators) {
                    this.#spectators = game.spectators;
                }

                if (this.isOwner(userId)) {
                    this.hand = this.#owner.hand;
                    this.tableau = this.#owner.tableau;
                    data.userReady = game.owner?.ready;
                    data.userDone = game.owner?.done;
                    data.playerType= Game.playerTypes.OWNER
                } else if (this.isOpponent(userId)) {
                    this.hand = this.#opponent.hand;
                    this.tableau = this.#opponent.tableau;
                    data.userReady = game.opponent?.ready;
                    data.userDone = game.opponent?.done;
                    data.playerType= Game.playerTypes.OPPONENT
                    Camera.getInstance().rotation = Math.PI;
                }
                
                if (game.stats) {
                    game.stats = processGameStats(game.stats);
                }
                
                this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));
                this._started = game.started;
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

    renderForeground(drawDraggingCards = false) {
        super.renderForeground(drawDraggingCards);

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
            const { tableau, hand, draggingCardsData } = deckRenders[i];

            hand.renderForeground(foreground);
        
            for (let i = 0; i < tableau.length; i++) {
                tableau[i].renderForeground(foreground);
            }

            if (hand.top('down')) {
                foreground.drawImage(Game.cardBackImage.canvas, hand.position.x, hand.position.y);
            }
    
            // Render dragging cards last so they appear on top
            if (draggingCardsData) {
                for (let j = 0; j < draggingCardsData.cards.length; j++) {
                    const draggingCard = draggingCardsData.cards[j].card;
                    if (draggingCard.targetPosition) {
                        draggingCard.targetPosition;
                        draggingCard.position.x += (draggingCard.targetPosition.x - draggingCard.position.x) * 0.10;
                        draggingCard.position.y += (draggingCard.targetPosition.y - draggingCard.position.y) * 0.10;
                        Camera.getInstance().forceUpdate();
                    }
    
                    draggingCard.draw(foreground, 0.8);
                }
            }
        }

        // Render dragging cards last so they appear on top
        this.renderDraggingCards();
    }

    renderBackground() {
        super.renderBackground();

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

            for (let j = 0; j < tableau.length; j++) {
                tableau[j].renderBackground(foreground);
            }

            hand.renderBackground(foreground);
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

    isPlayer(userId = null) {
        return this.isOwner(userId) || this.isOpponent(userId);
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
        let logs = [];
        if (sessionId) {
            try {
                const { success, codes, game } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('create-game', { name, username: this.#username });
                console.log('create-game', { success, codes, game });
                if (success) {
                    this.#owner = game.owner;

                    this.hand = this.#owner.hand = Hand.createFromObject(game.owner.hand);
                    this.tableau = this.#owner.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(game.owner.tableau[i]));
                    this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));

                    GameController.setIsMultiplayer(true);
                    Camera.getInstance().recenter();
                    MultiplayerGame.#doEvent('create-game');
                }

                logs = [...logs, ...codes];
            } catch (e) {
                logs.push('failed-to-create-game');
            }
        } else {
            logs.push('missing-session-id');
        }

        MultiplayerGame.#doEvent('log', logs);
    }

    async joinGame(gameId) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        let logs = [];
        if (sessionId) {
            try {
                const { success, codes, game } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('join-game', { gameId, username: this.#username });
                console.log('join-game', { success, codes, game });
                if (success) {
                    this.loadGame(game);

                    let playerType = Game.playerTypes.SPECTATOR;
                    if (this.isOwner()) {
                        playerType = Game.playerTypes.OWNER;
                    } else if (this.isOpponent()) {
                        playerType = Game.playerTypes.OPPONENT;
                    }
                    MultiplayerGame.#doEvent('join-game', playerType);
                }

                logs = [...logs, ...codes];
            } catch (e) {
                logs.push('failed-to-join-game');
            }
        } else {
            logs.push('missing-session-id');
        }
         
        MultiplayerGame.#doEvent('log', logs);
    }

    async leaveGame() {
        const { sessionId } = MultiplayerGame.#socket.auth;
        let logs = [];
        if (sessionId) {
            try {
                const { success, codes } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('leave-game');
                console.log('leave-game', { success, codes });
                if (success) {
                    this.unloadGame();
                    Camera.getInstance().recenter();
                    MultiplayerGame.#doEvent('leave-game');
                }

                logs = [...logs, ...codes];
            } catch (e) {}
        } else {
            logs.push('missing-session-id');
        }

        MultiplayerGame.#doEvent('log', logs);
    }

    async handleToggleFlag(toggle, flag) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        let logs = [];
        if (sessionId && this.isPlayer()) {
            try {
                const { success, codes } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('toggle-flag', { flag, toggle });
                console.log('toggle-flag', { success, codes });
                if (!success) {
                    toggle = !toggle;
                }
            } catch (e) {
                // the server did not acknowledge the event
                toggle = !toggle;
            }

            if (this.isOwner()) {
                this.#owner[flag] = toggle;
                MultiplayerGame.#doEvent('owner-update', { [flag]: toggle });
            } else if (this.isOpponent()) {
                this.#opponent[flag] = toggle;
                MultiplayerGame.#doEvent('opponent-update', { [flag]: toggle });
            }
            
            MultiplayerGame.#doEvent('toggle-flag', { flag, toggle });
        } else {
            logs.push('missing-session-id');
        }

        MultiplayerGame.#doEvent('log', logs);
    }

    loadGame(game) {
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

        if (this.isOwner()) {
            this.hand = this.#owner.hand;
            this.tableau = this.#owner.tableau;
        } else if (this.isOpponent()) {
            Camera.getInstance().rotation = Math.PI;
            this.hand = this.#opponent.hand;
            this.tableau = this.#opponent.tableau;
        }

        this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(game.foundations[i]));

        GameController.setIsMultiplayer(true);
        Camera.getInstance().recenter();
    }

    unloadGame() {
        this.#owner = undefined;
        this.#opponent = undefined;
        this.#spectators = {};
        this.tableau = undefined;
        this.hand = undefined;
        this.foundations = undefined;
        this._started = false;
        
        GameController.setIsMultiplayer(false);
        Camera.getInstance().rotation = 0;
    }
    
    _onCardPick(x, y) {
        MultiplayerGame.#socket.emit('card-pick', { x, y });
    }

    #cardMoveTimeout;
    _onCardMove(x, y) {
        if (!this.#cardMoveTimeout) {
            MultiplayerGame.#socket.volatile.emit('card-move', { x, y });
            this.#cardMoveTimeout = setTimeout(() => {
                this.#cardMoveTimeout = undefined;
            }, 41); // ~24 updates/s throttle
        }
    }

    async _onCardDrop(x, y, dropTarget) {
        let logs = [];
        try {
            const { success, codes, gameState } = await MultiplayerGame.#socket.timeout(1000).emitWithAck('card-drop', { x, y, dropTarget });
            console.log('card-drop', success, codes, gameState);
            if (!success) {
                this._loadGameState(gameState);
            }

            logs = [...logs, ...codes];
        } catch (e) {
            console.log(e);
            this._requestGameState();
        }

        MultiplayerGame.#doEvent('log', logs);
    }

    async _requestGameState() {
        let logs = [];
        try {
            const data = await MultiplayerGame.#socket.timeout(1000).emitWithAck('request-game-state');
            const { success, codes, gameState } = data;
            console.log('request-game-state', success, codes, gameState);
            if (success) {
                this._loadGameState(gameState);
            }

            logs = [...logs, ...codes];
            MultiplayerGame.#doEvent('request-game-state', data);
        } catch (e) {
            console.log(e);
            logs.push('failed-to-get-game-state')
        }

        MultiplayerGame.#doEvent('log', logs);
    }

    _loadGameState(gameState) {
        const { hand, tableau, foundations } = gameState;

        if (hand && tableau) {
            this.hand = Hand.createFromObject(hand);
            this.tableau = Array.from({ length: 7 }, (e, i) => Tableau.createFromObject(tableau[i]));

            if (this.isOwner()) {
                this.#owner.hand = this.hand;
                this.#owner.tableau = this.tableau;
            } else if (this.isOpponent()) {
                this.#opponent.hand = this.hand;
                this.#opponent.tableau = this.tableau;
            }
        }
        
        this.foundations = Array.from({ length: 8 }, (e, i) => Foundations.createFromObject(foundations[i]));

        this._resetDraggingCardsData();
        Camera.getInstance().forceUpdate();
    }
}
