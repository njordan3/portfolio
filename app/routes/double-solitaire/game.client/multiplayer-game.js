import { Game } from './game';
import io from 'socket.io-client';

export class MultiplayerGame extends Game {
    static #socket = io({
        autoConnect: false,
    });

    static #eventCallbacks = {};

    #username = '';

    #owner;
    #opponent;
    #spectators = [];

    get username() {
        return this.#username;
    }

    set username(username) {
        this.#username = username;
        localStorage.setItem('username', username);
    }

    constructor() {
        super();

        if (this.$instance) {
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
            MultiplayerGame.#doEvent('game-end', data);
        });

        MultiplayerGame.#socket.on('user-joined', (data) => {
            console.log('user-joined', data);
            MultiplayerGame.#doEvent('user-joined', data);
        });

        MultiplayerGame.#socket.on('player-joined', (data) => {
            console.log('player-joined', data);
            MultiplayerGame.#doEvent('player-joined', data);
        });

        MultiplayerGame.#socket.on('user-left', (data) => {
            console.log('user-left', data);
            MultiplayerGame.#doEvent('user-left', data);
        });

        MultiplayerGame.#socket.on('session', (data) => {
            console.log('session', data);
            const { sessionId, userId } = data;
            
            MultiplayerGame.#socket.auth = { sessionId };
            localStorage.setItem('sessionId', sessionId);
            MultiplayerGame.#socket.userId = userId;
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
        if (!this.$instance) {
            this.$instance = new MultiplayerGame();
        }

        return this.$instance;
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

    isGameConnected() {
        return this.isServerConnected() && this.#owner;
    }

    async createGame(name) {
        const { sessionId } = MultiplayerGame.#socket.auth;
        if (sessionId) {
            try {
                const { success, code, events, game } = await MultiplayerGame.#socket.timeout(3000).emitWithAck('create-game', { name, username: this.#username });
                console.log('create-game', { success, code, events, game });
                if (success) {
                    this.#owner = game.owner;
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
                    this.#owner = game.owner;
                    this.#opponent = game.opponent;
                    this.#spectators = game.spectators;
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
                    this.#owner = undefined;
                    this.#opponent = undefined;
                    this.#spectators = undefined;
                    MultiplayerGame.#doEvent('leave-game');
                }
            } catch (e) {
                // the server did not acknowledge the event
            }
        }
         
        return false;
    }
    
    $onCardPick(x, y) {
        MultiplayerGame.#socket.emit('card-pick', { x, y });
    }

    $onCardMove(x, y) {
        MultiplayerGame.#socket.emit('card-move', { x, y });
    }

    $onCardDrop(x, y) {
        MultiplayerGame.#socket.emit('card-drop', { x, y });
    }
}
