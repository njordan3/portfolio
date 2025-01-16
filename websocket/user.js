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

    get connected() {
        return this?.gameState.flags.connected ?? false;
    }
    get ready() {
        return this?.gameState.flags.ready ?? false;
    }
    get done() {
        return this?.gameState.flags.done ?? false;
    }
    get voteRestart() {
        return this?.gameState.flags.voteRestart ?? false;
    }

    #disconnectTimeout;

    constructor() {
        this.#id = randomId();
    }

    toggleFlag(socket, flag, toggle) {
        if (this.gameState && this.gameState.flags[flag] !== undefined) {
            this.gameState.flags[flag] = toggle;
            socket.to(this.gameState.gameId).emit('player-update', { id: this.#id, [flag]: toggle });

            if (flag === 'connected' && toggle) {
                socket.join(this.gameState.gameId); // Rejoin game room if reconnecting
            }

            return toggle;
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