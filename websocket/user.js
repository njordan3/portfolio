import { randomId, sanitizeString } from "./utils.js";

export default class User {
    gameState;

    #name = 'Anonymous';
    get name() {
        return this.#name;
    }
    set name(name) {
        const cleanName = sanitizeString(name);
        this.#name = cleanName ? cleanName.substring(0, 24) : 'Anonymous';
    }

    #id;
    get id() {
        return this.#id;
    }

    #disconnectTimeout;

    constructor() {
        this.#id = randomId();
    }

    setConnected(socket, connected) {
        if (this.gameState) {
            if (connected !== this.gameState.connected) {   
                socket.to(this.gameState.gameId).emit('player-update', { id: this.#id, connected });

                if (connected) {
                    socket.join(this.gameState.gameId); // Rejoin game room if reconnecting
                }
            }
            this.gameState.connected = connected;
            
            return connected;
        }
        
        return null;
    }

    readyUp(socket, ready) {
        if (this.gameState) {
            this.gameState.ready = ready;
            socket.to(this.gameState.gameId).emit('player-update', { id: this.#id, ready });
            return ready;
        }
        
        return null;
    }

    setDone(socket, done) {
        if (this.gameState) {
            this.gameState.done = done;
            socket.to(this.gameState.gameId).emit('player-update', { id: this.#id, done });
            return done;
        }
        
        return null;
    }

    setDisconnectTimeout(callback, timer, ...args) {
        if (this.#disconnectTimeout) {
            this.clearDisconnectTimeout();
        }

        this.#disconnectTimeout = setTimeout(callback, timer, ...args);
    }

    clearDisconnectTimeout() {
        clearTimeout(this.#disconnectTimeout);
        this.#disconnectTimeout = undefined;
    }

    toGameJSON() {
        if (!this.gameState) {
            return this.toJSON();
        }

        return {
            id: this.#id,
            name: this.#name,
            ...this.gameState.toJSON(),
        };
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
        };
    }
}