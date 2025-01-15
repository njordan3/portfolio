import User from './user.js';
import { randomId } from "./utils.js";

// Singleton
export default class UserSessions {
    #sessions = new Map();
    static io;
    
    static #instance;

    static getInstance() {
        if (!this.#instance) {
            this.#instance = new UserSessions();
        }

        return this.#instance;
    }

    createSession(socket) {
        const sessionId = randomId();
        const user = new User();
        this.#sessions.set(sessionId, { user });
        socket.user = user;
        socket.sessionId = sessionId;
    }

    deleteSession(sessionId) {
        this.#sessions.delete(sessionId);
    }
    
    getSession(id) {
        return this.#sessions.get(id);
    }

    toJSON() {
        const users = {};
        this.#sessions.forEach(({ user }, id) => {
            users[id] = user.toJSON();
        })
        return users;
    }
}