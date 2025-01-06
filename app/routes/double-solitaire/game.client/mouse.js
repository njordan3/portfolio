export class Mouse {
    #position = { x: 0, y: 0 };
    #oldPosition = { x: 0, y: 0 };

    button = false;

    set position(position) {
        this.#oldPosition = this.#position;
        this.#position = position;
    }

    get position() {
        return this.#position;
    }

    get oldPosition() {
        return this.#oldPosition;
    }

    // Singleton
    static $instance;

    constructor() {
        if (this.$instance) {
            throw Error('Multiple mice? That\'s crazy...');
        }
    }

    static getInstance() {
        if (!this.$instance) {
            this.$instance = new Mouse();
        }

        return this.$instance;
    }
}