import { randomId, sanitizeString } from "./utils.js";

export default class User {
    gameInstance;
    #name = 'Anonymous';
    #id;
    #disconnectTimeout;

    constructor() {
        this.#id = randomId();
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    set name(name) {
        const cleanName = sanitizeString(name);
        this.#name = cleanName ? cleanName.substring(0, 24) : 'Anonymous';
        console.log({ name, _name: this.#name });
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

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
        };
    }
}