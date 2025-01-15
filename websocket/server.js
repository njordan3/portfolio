import { Server } from 'socket.io';
import UserSessions from './user-sessions.js';
import GameInstances from './game-instances.js';
import { sanitizeString } from './utils.js';

export default function initWebSocketServer(httpServer) {
  const io = UserSessions.io = GameInstances.io = new Server(httpServer);
  const userSessions = UserSessions.getInstance();
  const gameInstances = GameInstances.getInstance();
  
  io.on('connection', (socket) => {
    socket.user.clearDisconnectTimeout();
    socket.user.toggleFlag(socket, 'connected', true);
  
    socket.on('create-game', ({ name, username }, callback) => {
      socket.user.name = username;
      const codes = [];
      try {
        if (gameInstances.leaveGame(socket)) {
          codes.push('left-game');
        }
  
        const newGame = gameInstances.createGame(socket, name);
        if (newGame) {
          codes.push('created-game');
          return callback({
            success: true,
            game: newGame.toGameJSON(),
            codes,
          });
        }
  
        codes.push(newGame === null ? 'unable-to-create-game:max-games' : 'unable-to-create-game');
      } catch (e) {
        console.error(e);
        codes.push('unable-to-create-game');
      }
      
      callback({
        success: false,
        codes,
      });
    });
  
    socket.on('join-game', ({ gameId, username }, callback) => {
      socket.user.name = username;
      const codes = [];

      try {
        if (gameInstances.leaveGame(socket)) {
          codes.push('left-game');
        }
  
        const joinedGame = gameInstances.joinGame(socket, gameId);
        if (joinedGame) {
          codes.push('joined-game');
          return callback({
            success: true,
            game: joinedGame.toGameJSON(),
            codes,
          });
        }
        
        codes.push(joinedGame === null ? 'game-not-found' : 'failed-to-join-game');
      } catch (e) {
        console.error(e);
        codes.push('failed-to-join-game');
      }
      
      callback({
        success: false,
        codes,
      });
    });
  
    socket.on('leave-game', (callback) => {
      const codes = [];

      try {
        if (gameInstances.leaveGame(socket)) {
          codes.push('left-game');
        }
      } catch (e) {
        console.error(e);
      }
      
      // Leave game is always deemed successful
      callback({
        success: true,
        codes,
      });
    });

    socket.on('toggle-flag', ({ flag, toggle }, callback) => {
      const codes = [];

      try {
        const { sessionId, user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (!game || !game.userIsPlaying(sessionId)) {
          codes.push('not-playing-game');
          return callback({
            success: false,
            codes,
          });
        }
  
        const toggleResult = user.toggleFlag(socket, flag, toggle);
        const success = toggleResult === toggle;
        if (!success) {
          codes.push('unable-to-toggle');
        }
        callback({
          success,
          codes
        });

        try {
          if (toggle) {
            switch(flag) {
              case 'ready':
                if (game.ready()) {
                  game.startStartTimer(() => {
                    game.start();
                    io.to(game.id).emit('game-start');
                  });
                  io.to(game.id).emit('game-start-timer', { time: game.startTime });
                }
                break;
              case 'done':
                if (game.done()) {
                  io.to(game.id).emit('game-complete', game.stats);
                }
                break;
              case 'voteRestart':
                if (game.restart()) {
                  io.to(game.id).emit('game-restart', game.toGameJSON());
                }
                break;
            }
          }
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
        codes.push('unable-to-toggle');
        callback({
          success: false,
          codes
        });
      }
    });

    socket.on('card-pick', ({ x, y }) => {
      try {
        const { user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (game && game.started && game.userIsPlaying(sessionId)) {
          gameState.pickTargetAtPoint(socket, x, y);
        }
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('card-move', ({ x, y }) => {
      try {
        const { user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (game && game.started && game.userIsPlaying(sessionId)) {
          gameState.dragCards(socket, x, y);
        }
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('card-drop', ({ x, y, dropTarget }, callback) => {
      const codes = [];
      const result = {
        success: false,
      }

      try {
        const { user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (game) {
          if (!game.started) {
            codes.push('game-not-started');
            result.codes = codes;
            return callback(result);
          }

          if (game.dropCardsAtPoint(socket, x, y) === dropTarget) {
            callback({
              success: true,
              codes
            });

            if (sanitizeString(dropTarget).includes('foundations') && game.done()) {
              io.to(game.id).emit('game-complete', game.stats);
            }

            return;
          }
        }
  
        if (gameState) {
          // Reset cards if drop fails
          gameState.resetDraggingCardsData();
          result.gameState = game.getCards(socket);
        }
      } catch (e) {
        console.error(e);
      }

      codes.push('failed-to-drop-card');
      result.codes = codes;
      callback(result);
    });

    socket.on('request-game-state', (callback) => {
      const codes = [];

      try {
        const { user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (game) {
          codes.push('fresh-game-state');
          return callback({
            success: true,
            codes,
            gameState: game.getCards(socket)
          });
        }
      } catch (e) {
        console.error(e);
      }

      codes.push('failed-to-get-game-state');

      callback({
        success: false,
        codes,
      });
    });
  
    socket.on('disconnecting', () => {
      // Leave games and remove user sessions
      const { sessionId, user } = socket;
      socket.user.toggleFlag(socket, 'connected', false);

      user.setDisconnectTimeout((sessionId) => {
        const session = userSessions.getSession(sessionId);

        if (session) {
          const { user } = session;
          const { gameState } = user;
          const existingGame = gameInstances.getGame(gameState?.gameId ?? null);

          if (existingGame) {
            const deleteGame = existingGame.leave(socket);

            if (deleteGame) {
              gameInstances.deleteGame(existingGame.id);
            }
          }

          userSessions.deleteSession(sessionId);
        }
      }, 60000, sessionId);
    });
  
    // Deliver session and user data for client's safe-keeping
    const { sessionId, user } = socket;
    const session = {
      sessionId: sessionId,
      userId: user.id,
      games: gameInstances,
    };

    const game = gameInstances.getGame(user.gameState?.gameId ?? null);
    if (game) {
      session.game = game.toGameJSON();
    }

    socket.emit('session', session);
  });
  
  // Middleware
  io.use((socket, next) => {
    const { sessionId } = socket.handshake.auth;

    if (sessionId) {
      const session = userSessions.getSession(sessionId);
  
      if (session) {
        socket.sessionId = sessionId;
        socket.user = session.user;
        return next();
      }
    }
  
    userSessions.createSession(socket);
    next();
  });
}