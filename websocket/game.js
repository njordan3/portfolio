import { UserGameState } from './user-game-state.js';
import UserSessions from './user-sessions.js';
import { sanitizeString } from './utils.js';

export default class Game {
    #id;
    name;

    // Session IDs
    #owner;
    #opponent;
    #spectators = new Set();

    constructor(socket, id, name) {
        this.#id = id;
        const cleanName = sanitizeString(name);
        this.name = cleanName ? cleanName.substring(0, 24) : 'Anonymous Game';
        this.#owner = socket.sessionId;

        socket.user.gameState = new UserGameState(this.#id);
        socket.join(this.#id);
    }

    get id() {
        return this.#id;
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
            socket.to(this.#id).emit('player-joined', user.toGameJSON());
            this.#opponent = sessionId;
        }

        return true;
    }

    leave(socket) {
        const { sessionId, user } = socket;
        let deleteGame = false;
    
        if (this.userIsPlaying(sessionId)) {
            // If a player left, end the game
            socket.to(this.#id).emit('player-left', user);
            deleteGame = true;
        } else if (this.userInGame(sessionId)) {
            // If not playing, but user is in game they are a spectator
            socket.to(this.#id).emit('user-left', user);
            this.#spectators.delete(sessionId);
        }

        user.gameState = undefined;
        socket.leave(this.#id);
        
        return deleteGame;
    }

    userInGame(sessionId) {
        return sessionId === this.#owner || sessionId === this.#opponent || this.#spectators.has(sessionId);
    }

    userIsPlaying(sessionId) {
        return sessionId === this.#owner || sessionId === this.#opponent;
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
        
        return {
            name: this.name,
            owner,
            opponent,
            spectators: spectators,
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