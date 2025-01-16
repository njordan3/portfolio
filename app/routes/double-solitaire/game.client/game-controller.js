import { MultiplayerGame } from "./multiplayer-game";
import { SingleplayerGame } from "./singleplayer-game";

/**
 * Essentially a stack of games, and the getGame() function will always return the top of the stack.
 * 
 * The singleplayer instance should always be first in the array.
 * The multiplayer instance gets pushed onto the stack when it's the game we want to render.
 */
export class GameController {
    static #gameStack = [];

    static isMultiplayer() {
        return GameController.#gameStack.length === 2;
    }

    static setIsMultiplayer(isMultiplayer) {
        if (isMultiplayer && GameController.#gameStack.length === 1) {
            GameController.#gameStack.push(MultiplayerGame.getInstance());
        } else if (!isMultiplayer && GameController.#gameStack.length > 1) {
            GameController.#gameStack.pop();
        }
    }

    static getGame() {
        if (GameController.#gameStack.length <= 0) {
            GameController.#gameStack.push(SingleplayerGame.getInstance());
        }
        return GameController.#gameStack[GameController.#gameStack.length-1];
    }
}