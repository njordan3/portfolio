import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

function GameItem(props) {
    const {
        holdTime = 1, // Seconds
        onComplete = () => {},
        game,
        id,
        onMouseEnter,
        selected = false,
    } = props;

    const interval = useMemo(() => 10/holdTime, [holdTime]);
    const [holdProgress, setHoldProgress] = useState(0);
    const [complete, setComplete] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const progressTimerRef = useRef(null);
    const helpTimerRef = useRef(null);
    const handleMouseDown = useCallback(() => {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
            setHoldProgress((prevProgress) => {
                const newProgress = prevProgress + interval
                if (newProgress >= 100) {
                    clearInterval(progressTimerRef.current);
                    return 100;
                }
                return newProgress;
            });
        }, 100);
    }, [interval, setHoldProgress, onComplete]);

    const handleMouseUp = useCallback(() => {
        clearInterval(progressTimerRef.current);
        if (!complete) {
            progressTimerRef.current = setInterval(() => {
                setHoldProgress((prevProgress) => {
                    const newProgress = prevProgress - interval
                    if (newProgress <= 0) {
                        clearInterval(progressTimerRef.current);
                        return 0;
                    }
                    return newProgress;
                });
            }, 100);
        }
    }, [interval, setHoldProgress, onComplete, complete]);

    useEffect(() => {
        if (holdProgress >= 100) {
            setComplete(true);
            onComplete();
        }
    }, [holdProgress])

    useEffect(() => {
        return () => {
            clearInterval(progressTimerRef.current);
            clearTimeout(helpTimerRef.current);
        };
    }, []);

    const handleShowHelp = useCallback(() => {
        setShowHelp(true);
        helpTimerRef.current = setTimeout(() => {
            setShowHelp(false);
        }, 5000);
    }, [helpTimerRef, setShowHelp]);

    const { name, owner, opponent, spectators } = game;
    
    return (
        <li
            className={`${selected ? 'bg-secondary-color text-invert-font-color' : ''} relative flex flex-row justify-between p-1 rounded-sm cursor-pointer hover:[background-color:var(--secondary-color)] hover:[color:var(--invert-font-color)]`}
            title={`${name} (hold to join)`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={handleMouseUp}
            onClick={handleShowHelp}
        >
            <div 
                className="absolute bottom-0 left-0 h-[5px] bg-[green]"
                style={{
                    width: `${holdProgress}%`,
                    transition: 'width 0.1s ease'
                }}
            />
            <p className="m-0 truncate">{name}</p>
            {showHelp && !complete && (
                <>(Hold)</>
            )}
        </li>
    );
};

export default function GameBrowser(props) {
    const { games } = props;
    const hasGames = useMemo(() => games && Object.keys(games).length, [games]);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const selectedGame = useMemo(() => {
        if (!games[selectedGameId]) {
            return null;
        }

        const { owner = {}, opponent = {}, spectators = {} } = games[selectedGameId];

        return {
            owner: owner?.name ? owner.name : '[empty]',
            opponent: opponent?.name ? opponent.name : '[empty]',
            spectatorCount: spectators ? Object.keys(spectators).length : 0,
        };
    }, [games, selectedGameId]);

    const joinGame = useCallback(() => {
        MultiplayerGame.getInstance().joinGame(selectedGameId);
    }, [selectedGameId]);

    return (
        <>
            <legend>Game Browser</legend>
            {selectedGame ? (
                <div className={`${selectedGame ? '' : 'invisible'} border border-font-color mb-4 py-[0.7em] px-[0.5em]`}>
                    <p className="my-1 text-xs truncate">{selectedGame.owner}</p>
                    <p className="my-1 text-xs truncate">{selectedGame.opponent}</p>
                    <p className="my-1 text-xs">{selectedGame.spectatorCount} Spectators</p>
                </div>
            ) : (
                <div className="border border-font-color mb-4 py-[0.7em] px-[0.5em]">
                    <p className="my-1 text-xs invisible">Owner</p>
                    <p className="my-1 text-xs invisible">Opponent</p>
                    <p className="my-1 text-xs invisible">Spectators</p>
                </div>
            )}
            {hasGames ? (
                <ul className="game-browser my-0 flex-auto h-0 overflow-y-auto">
                    {Object.keys(games).map((gameId) => (
                        <GameItem
                            key={gameId}
                            id={gameId}
                            game={games[gameId]}
                            selected={gameId === selectedGameId}
                            onMouseEnter={() => setSelectedGameId(gameId)}
                            onComplete={joinGame}
                        />
                    ))}
                </ul>
            ) : (
                <>
                    <p>No Games Available</p>
                    <p className="text-xs">Create one and wait for others to join!</p>
                </>
            )}
        </>
    )
}