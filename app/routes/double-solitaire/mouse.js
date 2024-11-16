export class Mouse {
    #position = { x: 0, y: 0 };
    #oldPosition = { x: 0, y: 0 };

    button = false;

    constructor() {

    }

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
}