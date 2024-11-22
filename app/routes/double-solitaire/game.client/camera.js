export default class Camera {
    #scale = 1;
    #zoomInStep = 1.1;
    #zoomOutStep;

    #maxScale = 3;
    #minScale = 0.5;

    #backgroundContext;
    #foregroundContext;
    #position = { x: 0, y: 0 };
    #needsUpdate = true;
    #matrix = [1, 0, 0, 1, 0, 0]; // current view transform

    constructor() {
        this.#zoomOutStep = 1/this.#zoomInStep;
    }

    get needsUpdate() {
        return this.#needsUpdate;
    }

    get contexts() {
        return {
            background: this.#backgroundContext,
            foreground: this.#foregroundContext,
        };
    }

    setContexts(fContext, bContext) {
        this.#foregroundContext = fContext;
        this.#backgroundContext = bContext;
    }

    reset() {
        const { width, height } = this.#backgroundContext.canvas;

        this.#backgroundContext.setTransform(1, 0, 0, 1, 0, 0);
        this.#backgroundContext.clearRect(0, 0, width, height);

        this.#foregroundContext.setTransform(1, 0, 0, 1, 0, 0);
        this.#foregroundContext.clearRect(0, 0, width, height);
    }

    apply() {
        if (this.#needsUpdate) {
            this.update()
        }

        const m = this.#matrix;
        this.#backgroundContext.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        this.#foregroundContext.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    }

    update() {
        this.#needsUpdate = false;
        this.#matrix[3] = this.#matrix[0] = this.#scale;
        this.#matrix[2] = this.#matrix[1] = 0;
        this.#matrix[4] = this.#position.x;
        this.#matrix[5] = this.#position.y;
    }

    pan(position) {
        if (this.#needsUpdate) {
            this.update()
        }

        const { x, y } = position;

        this.#position.x += x;
        this.#position.y += y;
        this.#needsUpdate = true;
    }

    scaleAt(position, direction) { // position in screen coords
        const amount = direction < 0 ? this.#zoomInStep : this.#zoomOutStep;
        const newScale = this.#scale * amount;
        if (newScale > this.#maxScale || newScale < this.#minScale) {
            return;
        }

        if (this.#needsUpdate) {
            this.update()
        }

        const { x, y } = position;

        this.#scale = newScale;
        this.#position.x = x - (x - this.#position.x) * amount;
        this.#position.y = y - (y - this.#position.y) * amount;
        this.#needsUpdate = true;
    }

    forceUpdate() {
        this.#needsUpdate = true;
    }

    getBoardPosition(x, y) {
        return {
            x: (-this.#position.x + x) / this.#scale,
            y: (-this.#position.y + y) / this.#scale,
        };
    }
}