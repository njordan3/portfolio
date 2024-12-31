import { Server } from 'socket.io';
import UserSessions from './user-sessions.js';
import GameInstances from './game-instances.js';

export default function initWebSocketServer(httpServer) {
  const io = UserSessions.io = GameInstances.io = new Server(httpServer);
  const userSessions = UserSessions.getInstance();
  const gameInstances = GameInstances.getInstance();
  
  io.on('connection', (socket) => {
    console.log('connected', socket.user.id, socket.user.name, socket.rooms);
    console.log(userSessions.toJSON());
    socket.user.clearDisconnectTimeout();
  
    socket.on('create-game', ({ name, username }, callback) => {
      console.log('create-game', username)
      socket.user.name = username;
      const events = [];
  
      if (gameInstances.leaveGame(socket)) {
        events.push('left-game');
      }
  
      const newGame = gameInstances.createGame(socket, name);
      console.log('created game', gameInstances.toJSON());
      callback({
        success: true,
        game: newGame,
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
        game: joinedGame,
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
  
    socket.on('disconnecting', () => {
      // Leave games and remove user sessions
      const { sessionId, user } = socket;

      user.setDisconnectTimeout((sessionId) => {
        const session = userSessions.getSession(sessionId);

        if (session) {
          const { user } = session;
          const { gameInstance } = user;
          const existingGame = gameInstances.getGame(gameInstance);

          if (existingGame) {
            const deleteGame = existingGame.leave(socket);

            if (deleteGame) {
              gameInstances.deleteGame(existingGame.id);
            }
          }

          userSessions.deleteSession(sessionId);
        }
      }, 60000, sessionId)

      console.log('disconnecting', socket.user.id, socket.user.name, socket.rooms); // the Set contains at least the socket ID
      console.log(userSessions.toJSON());
    });
  
    // Deliver session and user data for client's safe-keeping
    const { sessionId, user } = socket;
    socket.emit('session', {
      sessionId: sessionId,
      userId: user.id,
      games: gameInstances,
    });
  });
  
  // Middleware
  io.use((socket, next) => {
    const sessionId = socket.handshake.auth.sessionId;
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