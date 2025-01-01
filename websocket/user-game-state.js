export class UserGameState {
    #gameId;
    get gameId() {
        return this.#gameId;
    }

    ready = false;
    connected = true;

    constructor(gameId) {
        this.#gameId = gameId;
    }

    toJSON() {
        return {
            ready: this.ready,
            connected: this.connected,
        };
    }
}