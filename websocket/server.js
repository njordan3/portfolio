import { Server } from 'socket.io';
import UserSessions from './user-sessions.js';
import GameInstances from './game-instances.js';

export default function initWebSocketServer(httpServer) {
  const io = UserSessions.io = GameInstances.io = new Server(httpServer);
  const userSessions = UserSessions.getInstance();
  const gameInstances = GameInstances.getInstance();
  
  io.on('connection', (socket) => {
    socket.user.clearDisconnectTimeout();
    socket.user.setConnected(socket, true);
  
    socket.on('create-game', ({ name, username }, callback) => {
      socket.user.name = username;
      const events = [];
  
      if (gameInstances.leaveGame(socket)) {
        events.push('left-game');
      }
  
      const newGame = gameInstances.createGame(socket, name);
      console.log('created game', gameInstances.toJSON());
      callback({
        success: true,
        game: newGame.toGameJSON(),
        events,
      });
    });
  
    socket.on('join-game', ({ gameId, username }, callback) => {
      socket.user.name = username;
      const events = [];
  
      if (gameInstances.leaveGame(socket)) {
        events.push('left-game');
      }

      const joinedGame = gameInstances.joinGame(socket, gameId);
      if (!joinedGame) {
        return callback({
          success: false,
          code: joinedGame === null ? 'game-not-found' : 'unable-to-join',
          events,
        });
      }

      return callback({
        success: true,
        game: joinedGame.toGameJSON(),
        events,
      });
    });
  
    socket.on('leave-game', (callback) => {
      const events = [];
      if (gameInstances.leaveGame(socket)) {
        events.push('left-game');
      }
      console.log('left game', gameInstances.toJSON());

      // Leave game is always deemed successful
      return callback({
        success: true,
        events,
      });
    });

    socket.on('ready-up', ({ ready }, callback) => {
      const events = [];
      const { sessionId, user } = socket;
      const { gameState } = user;
      const game = gameInstances.getGame(gameState?.gameId ?? null);
      if (!game || !game.userIsPlaying(sessionId)) {
        return callback({
          success: false,
          events,
          code: 'not-playing-game',
        });
      }
      
      const readyResult = user.readyUp(socket, ready);
      const success = readyResult === ready;
      const response = {
        success,
        events,
      };
      if (!success) {
        response.code = 'unable-to-ready';
      }

      if (ready && game.ready()) {
        game.startStartTimer(() => {
          game.start();
          io.to(game.id).emit('game-start');
        });
        io.to(game.id).emit('game-start-timer', { time: game.startTime });
      }

      return callback(response);
    });

    socket.on('set-done', ({ done }, callback) => {
      const events = [];
      const { sessionId, user } = socket;
      const { gameState } = user;
      const game = gameInstances.getGame(gameState?.gameId ?? null);
      if (!game || !game.userIsPlaying(sessionId)) {
        return callback({
          success: false,
          events,
          code: 'not-playing-game',
        });
      }
      
      const doneResult = user.setDone(socket, done);
      const success = doneResult === done;
      const response = {
        success,
        events,
      };
      if (!success) {
        response.code = 'unable-to-done';
      }

      if (done && game.done()) {
        gameInstances.deleteGame(game.id);
      }

      return callback(response);
    });

    socket.on('card-pick', ({ x, y }) => {
      const { user } = socket;
      const { gameState } = user;
      const game = gameInstances.getGame(gameState?.gameId ?? null);
      if (game && game.userIsPlaying(sessionId)) {
        gameState.pickTargetAtPoint(socket, x, y);
      }
    });

    socket.on('card-move', ({ x, y }) => {
      const { user } = socket;
      const { gameState } = user;
      const game = gameInstances.getGame(gameState?.gameId ?? null);
      if (game && game.userIsPlaying(sessionId)) {
        gameState.dragCards(socket, x, y);
      }
    });

    socket.on('card-drop', ({ x, y, droppedOnTarget }, callback) => {
      const result = {
        success: false,
        code: 'failed-to-drop-card',
      }

      try {
        const { user } = socket;
        const { gameState } = user;
        const game = gameInstances.getGame(gameState?.gameId ?? null);
        if (game) {
          if (game.dropCardsAtPoint(socket, x, y) === droppedOnTarget) {
            return callback({
              success: true
            });
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

      callback(result);
    });

    socket.on('request-game-state', (callback) => {
      const { user } = socket;
      const { gameState } = user;
      const game = gameInstances.getGame(gameState?.gameId ?? null);
      if (game) {
        return callback({
          success: true,
          gameState: game.getCards(socket)
        });
      }

      callback({
        success: false,
        code: 'failed-to-get-game-state'
      });
    });
  
    socket.on('disconnecting', () => {
      // Leave games and remove user sessions
      const { sessionId, user } = socket;
      user.setConnected(socket, false);

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