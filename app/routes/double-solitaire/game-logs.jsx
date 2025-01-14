import { useState, useEffect, useRef } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

const logMessage = {
    'missing-session-id': { style: 'error', msg: 'missing server session' },
    'unable-to-create-game': { style: 'error', msg: 'unable to create game' },
    'unable-to-create-game:max-games': { style: 'error', msg: 'max game capacity reached. unable to create game' },
    'game-not-found': { style: 'error', msg: 'game not found' },
    'not-playing-game': { style: 'error', msg: 'action not permitted. not playing game' },
    'unable-to-toggle': { style: 'error', msg: 'failed to set flag' },
    'failed-to-drop-card': { style: 'error', msg: 'failed to drop card' },
    'game-not-started': { style: 'error', msg: 'action not permitted. game not started' },
    'failed-to-get-game-state': { style: 'error', msg: 'failed to get game state' },
    'left-game': { msg: 'left game' },
    'failed-to-join-game': { style: 'error', msg: 'failed to join game' },
    'joined-game': { msg: 'successfully joined game' },
    'created-game': { msg: 'successfully created game' },
    'user-joined-game': { msg: 'user joined the game' },
    'player-joined-game': { msg: 'player joined the game' },
    'player-left-game': { msg: 'player left the game' },
    'user-left-game': { msg: 'user left the game' },
    'game-started': { msg: 'game has started!' },
    'game-ended': { msg: 'game has ended' },
    'game-completed': { msg: 'game has completed. vote to play again!' },
    'failed-to-create-game': { style: 'error', msg: 'failed to create game' },
    'fresh-game-state': { msg: 'fetched game state' },
    'disconnected': { style: 'error', msg: 'disconnected from server' },
    'connected': { msg: 'connected to server' }
}

export function GameLogs() {
    const [logs, setLogs] = useState([]);
    const logsBottom = useRef(null);

    useEffect(() => {
        logsBottom.current.scrollIntoView();
    }, [logs])

    useEffect(() => {
        MultiplayerGame.on('log', (logs) => setLogs((prev) => [...prev, ...logs]));
    }, []);

    return (
        <>
            <legend className="ml-3">Logs</legend>
            <ul  className="scroll-container my-1 flex-auto h-0 overflow-y-auto">
                {logs.map((code, i) => {
                    if (!logMessage[code]) {
                        return null;
                    }

                    const { style = '', msg } = logMessage[code];
                    return (
                        <li key={i} className={`text-xs mb-1 pl-3 even:text-[var(--secondary-color)] log ${style}`}>{msg}</li>
                    )
                })}
                <li ref={logsBottom} className="text-xs mb-1 pl-3 log last mb-5"></li>
            </ul>
        </>
    );
}