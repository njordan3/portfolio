import Game from "./game.js";
import { randomId } from "./utils.js";

// Singleton
export default class GameInstances {
    #instances = new Map();
    static io;

    static #instance;

    static getInstance() {
      if (!this.#instance) {
          this.#instance = new GameInstances();
      }

      return this.#instance;
    }

    createGame(socket, name) {
      const instanceId = randomId();
      const game = new Game(socket, instanceId, name);
      if (!game.join(socket)) {
        return false;
      }

      this.#instances.set(instanceId, game);
      GameInstances.io.emit('update-game-browser', { action: 'update', gameId: instanceId, game });

      return game;
    }

    joinGame(socket, gameId) {
      const game = this.getGame(gameId);
      if (game) {
        if (!game.join(socket)) {
          return false;
        }

        GameInstances.io.emit('update-game-browser', { action: 'update', gameId, game });
        return game;
      }
  
      return null
    }

    leaveGame(socket) {
      const { user } = socket;
      const { gameState } = user;
      const existingGame = this.getGame(gameState?.gameId ?? null);

      if (existingGame) {
        const deleteGame = existingGame.leave(socket);

        if (deleteGame) {
          this.deleteGame(existingGame.id);
        } else {
          GameInstances.io.emit('update-game-browser', { action: 'update', gameId: existingGame.id, game: existingGame });
        }

        return true;
      }

      return false;
    }

    deleteGame(gameId) {
      const game = this.getGame(gameId);
      if (game) {
        GameInstances.io.to(gameId).emit('game-end', game.getStats());
        GameInstances.io.emit('update-game-browser', { action: 'delete', gameId });
        this.#instances.delete(gameId);
      }
    }

    getGame(gameId) {
      return this.#instances.get(gameId);
    }

    toJSON() {
      const games = {};
      this.#instances.forEach((game, id) => {
        games[id] = game.toJSON();
      });
      return games;
  }
}