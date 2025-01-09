import { PlayerType, MultiplayerDimensions, Foundations, Card } from './game/internal.js';
import { UserGameState } from './user-game-state.js';
import UserSessions from './user-sessions.js';
import { sanitizeString } from './utils.js';

export default class Game {
    #id;
    name;
    #startTime = 5;
    get startTime() {
        return this.#startTime;
    }
    #startTimer;
    get startTimer() {
        return this.#startTimer;
    }
    started = false

    // Session IDs
    #owner;
    #opponent;
    #spectators = new Set();
    
    // 8 piles that build on the 8 aces
    #foundations;

    constructor(socket, id, name) {
        this.#id = id;
        const cleanName = sanitizeString(name);
        this.name = cleanName ? cleanName.substring(0, 24) : 'Anonymous Game';
        this.#owner = socket.sessionId;

        const { stackGap, foundationX, foundationY } = MultiplayerDimensions.getInstance();

        this.#foundations = Array.from({ length: 8 }, (e, i) => {
            const x = foundationX + ((Card.width + stackGap) * i);
            const y = foundationY;
            return new Foundations(x, y, Card.width, Card.height);
        });

        socket.user.gameState = new UserGameState(this.#id);
        socket.user.gameState.dealCards(PlayerType.OWNER);
        socket.join(this.#id);
    }

    get id() {
        return this.#id;
    }

    dropCardsAtPoint(socket, x, y) {
        const { sessionId, user } = socket;
        const { gameState } = user;
        if (this.userIsPlaying(sessionId) && gameState.draggingCardsData) {

            // Try dropping to user tableau. If dropped then return early
            if (gameState.dropCardsAtPoint(socket, x, y)) {
                return;
            }

            const { stack, cards } = gameState.draggingCardsData;

            // Foundations will only take a single dragged card
            if (cards.length === 1) {
                for (let i = this.#foundations.length-1; i >= 0; i--) {
                    if ( this.#foundations[i].isPointIntersected(x, y) ) {
                        if ( this.#foundations[i].isValidDrop(cards[0].card) ) {
                            stack.up.pop(); // Dragged cards will always be from up
                            this.#foundations[i].push(cards[0].card, 'up');

                            socket.to(this.#id).emit('player-card-drop', {
                                id: socket.user.id,
                                targetStackIndex: ['foundations', i],
                                draggingCardsData: gameState.draggingCardsJSON()
                            });

                            gameState.resetDraggingCardsData();
                            return;
                        }

                        break;
                    }
                }
            }

            socket.to(this.#id).emit('player-card-drop', { id: socket.user.id });
            gameState.resetDraggingCardsData();
        }
    }

    join(socket) {
        const { sessionId, user } = socket;

        // User is already in this game
        if ( this.userInGame(sessionId) ) {
            return true;
        }

        socket.user.gameState = new UserGameState(this.#id);
        socket.join(this.#id);

        if (this.#opponent) {
            socket.to(this.#id).emit('user-joined', user);
            this.#spectators.add(sessionId);
        } else {
            socket.user.gameState.dealCards(PlayerType.OPPONENT);
            socket.to(this.#id).emit('player-joined', user.toGameJSON());
            this.#opponent = sessionId;
        }

        return true;
    }

    leave(socket) {
        const { sessionId, user } = socket;
        let deleteGame = false;
    
        if (this.userIsPlaying(sessionId)) {
            // If owner leaves, then end game.
            // If opponent leaves and the game is started, then end game. If game is not started, then don't end game.
            socket.to(this.#id).emit('player-left', user);
            deleteGame = this.started || sessionId === this.#owner;

            if (!deleteGame) {
                this.#opponent = undefined;
            }
        } else if (this.userInGame(sessionId)) {
            // If not playing, but user is in game they are a spectator
            socket.to(this.#id).emit('user-left', user);
            this.#spectators.delete(sessionId);
        }

        user.gameState = undefined;
        socket.leave(this.#id);
        
        return deleteGame;
    }

    allLeave(io) {
        const userSessions = UserSessions.getInstance();

        this.#spectators.forEach((spectator) => {
            spectator = userSessions.getSession(spectator) ?? false;
            if (spectator) {
                spectator.gameState = undefined;
            }
        });

        const owner = userSessions.getSession(this.#owner)?.user ?? false;
        if (owner) {
            owner.gameState = undefined;
        }

        const opponent = userSessions.getSession(this.#opponent)?.user ?? false;
        if (opponent) {
            opponent.gameState = undefined;
        }

        io.in(this.#id).socketsLeave(this.#id);
    }

    ready() {
        const userSessions = UserSessions.getInstance();
        return userSessions.getSession(this.#owner)?.user.gameState?.ready && userSessions.getSession(this.#opponent)?.user.gameState?.ready;
    }

    done() {
        const userSessions = UserSessions.getInstance();
        return userSessions.getSession(this.#owner)?.user.gameState?.done && userSessions.getSession(this.#opponent)?.user.gameState?.done;
    }

    startStartTimer(callback) {
        this.#startTimer = setTimeout(callback, this.#startTime * 1000);
    }

    userInGame(sessionId) {
        return this.userIsOwner(sessionId) || this.userIsOpponent(sessionId) || this.#spectators.has(sessionId);
    }

    userIsPlaying(sessionId) {
        return sessionId === this.#owner || sessionId === this.#opponent;
    }

    userIsOwner(sessionId) {
        return sessionId === this.#owner;
    }

    userIsOpponent(sessionId) {
        return sessionId === this.#opponent;
    }

    getStats() {
        return {}
    }

    toGameJSON() {
        const userSessions = UserSessions.getInstance();
        const spectators = {};
        this.#spectators.forEach((spectator) => {
            spectators[spectator] = userSessions.getSession(spectator) ?? false;
        });

        let owner = userSessions.getSession(this.#owner)?.user ?? false;
        if (owner) {
            owner = owner.toGameJSON();
        }

        let opponent = userSessions.getSession(this.#opponent)?.user ?? false;
        if (opponent) {
            opponent = opponent.toGameJSON();
        }

        const foundations = [];
        for (let i = 0; i < this.#foundations.length; i++) {
            foundations.push(this.#foundations[i].toJSON());
        }
        
        return {
            name: this.name,
            owner,
            opponent,
            spectators: spectators,
            started: this.started,
            foundations
        };
    }

    toJSON() {
        const userSessions = UserSessions.getInstance();
        const spectators = {};
        this.#spectators.forEach((spectator) => {
            spectators[spectator] = userSessions.getSession(spectator) ?? false;
        });

        return {
            name: this.name,
            owner: userSessions.getSession(this.#owner)?.user ?? false,
            opponent: userSessions.getSession(this.#opponent)?.user ?? false,
            spectators: spectators,
        };
    }
}